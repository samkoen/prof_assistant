from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.schemas.types import AppEmail
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import require_roles
from app.models.course import CourseCatalog, CourseEnrollment, CourseOffering
from app.models.exam import QuestionAiExplanation, StudentExamAttempt
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.course import CourseOfferingCreate, CourseOfferingResponse
from app.security import hash_password
from app.services.course_helpers import offering_to_response

router = APIRouter(prefix="/admin", tags=["admin"])


class CreateUserRequest(BaseModel):
    email: AppEmail
    password: str = Field(min_length=6)
    full_name: str
    role: UserRole
    phone: str | None = None
    student_id: str | None = None


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=6)


class AdminOfferingCreate(BaseModel):
    teacher_id: int
    catalog_name: str = Field(min_length=1, max_length=255)
    catalog_description: str | None = None
    group_name: str = Field(min_length=1, max_length=255)
    academic_year: int = Field(ge=2000, le=2100)
    semester: int = Field(ge=1, le=3)
    description: str | None = None
    is_open_enrollment: bool = True


class TeacherOption(BaseModel):
    id: int
    full_name: str
    email: str

    model_config = {"from_attributes": True}


class AiExplanationCacheStats(BaseModel):
    total_rows: int
    distinct_students: int
    distinct_attempts: int


class AiExplanationCleanupResponse(BaseModel):
    deleted_rows: int


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    result = await db.execute(select(User).order_by(User.id))
    return result.scalars().all()


@router.post("/users", response_model=UserResponse)
async def create_user(
    body: CreateUserRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="האימייל כבר קיים")
    user = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
        phone=body.phone,
        student_id=body.student_id,
        email_verified=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/users/{user_id}/block")
async def block_user(
    user_id: int,
    blocked: bool,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="משתמש לא נמצא")
    user.is_blocked = blocked
    await db.commit()
    return {"ok": True}


@router.post("/users/{user_id}/reset-password")
async def reset_password(
    user_id: int,
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_roles(UserRole.ADMIN, UserRole.TEACHER)),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="משתמש לא נמצא")
    if current.role == UserRole.TEACHER:
        if user.role != UserRole.STUDENT:
            raise HTTPException(status_code=403, detail="אין הרשאה")
        enrolled = await db.execute(
            select(CourseEnrollment)
            .join(CourseOffering)
            .where(CourseEnrollment.student_id == user_id, CourseOffering.teacher_id == current.id)
        )
        if not enrolled.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="התלמיד לא בקורס שלך")
    user.password_hash = hash_password(body.new_password)
    await db.commit()
    return {"ok": True}


@router.get("/teachers", response_model=list[TeacherOption])
async def list_teachers(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    result = await db.execute(
        select(User).where(User.role == UserRole.TEACHER).order_by(User.full_name)
    )
    return result.scalars().all()


@router.post("/courses", response_model=CourseOfferingResponse)
async def admin_create_offering(
    body: AdminOfferingCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    teacher = await db.get(User, body.teacher_id)
    if not teacher or teacher.role != UserRole.TEACHER:
        raise HTTPException(status_code=400, detail="מורה לא נמצא")

    catalog = CourseCatalog(
        name=body.catalog_name,
        description=body.catalog_description,
        created_by_id=teacher.id,
    )
    db.add(catalog)
    await db.flush()

    offering = CourseOffering(
        catalog_course_id=catalog.id,
        teacher_id=teacher.id,
        group_name=body.group_name,
        academic_year=body.academic_year,
        semester=body.semester,
        description=body.description,
        is_open_enrollment=body.is_open_enrollment,
    )
    db.add(offering)
    await db.commit()

    result = await db.execute(
        select(CourseOffering)
        .options(
            selectinload(CourseOffering.catalog_course),
            selectinload(CourseOffering.teacher),
        )
        .where(CourseOffering.id == offering.id)
    )
    return offering_to_response(result.scalar_one())


@router.get("/courses", response_model=list[CourseOfferingResponse])
async def all_offerings(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    result = await db.execute(
        select(CourseOffering).options(
            selectinload(CourseOffering.catalog_course),
            selectinload(CourseOffering.teacher),
        )
    )
    return [offering_to_response(o) for o in result.scalars().all()]


@router.get("/ai-explanations/stats", response_model=AiExplanationCacheStats)
async def ai_explanations_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    total_rows = await db.scalar(select(func.count()).select_from(QuestionAiExplanation)) or 0
    distinct_students = (
        await db.scalar(
            select(func.count(func.distinct(StudentExamAttempt.student_id)))
            .select_from(QuestionAiExplanation)
            .join(StudentExamAttempt, StudentExamAttempt.id == QuestionAiExplanation.attempt_id)
        )
        or 0
    )
    distinct_attempts = (
        await db.scalar(select(func.count(func.distinct(QuestionAiExplanation.attempt_id))))
        or 0
    )
    return AiExplanationCacheStats(
        total_rows=total_rows,
        distinct_students=distinct_students,
        distinct_attempts=distinct_attempts,
    )


@router.delete("/ai-explanations", response_model=AiExplanationCleanupResponse)
async def cleanup_ai_explanations(
    older_than_days: int | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    stmt = delete(QuestionAiExplanation)
    if older_than_days is not None:
        if older_than_days < 1:
            raise HTTPException(status_code=400, detail="מספר הימים חייב להיות גדול מ-0")
        cutoff = datetime.now(timezone.utc) - timedelta(days=older_than_days)
        stmt = stmt.where(QuestionAiExplanation.updated_at < cutoff)
    result = await db.execute(stmt)
    await db.commit()
    return AiExplanationCleanupResponse(deleted_rows=result.rowcount or 0)
