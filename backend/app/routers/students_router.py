"""Routes élèves : création et liste."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.student import StudentCreate, StudentResponse
from app.security import hash_password

router = APIRouter(prefix="/students", tags=["students"])


@router.get("", response_model=list[StudentResponse])
async def list_students(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.TEACHER)),
):
    result = await db.execute(
        select(User).where(User.role == UserRole.STUDENT).order_by(User.full_name)
    )
    return result.scalars().all()


@router.post("", response_model=StudentResponse)
async def create_student(
    body: StudentCreate,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_roles(UserRole.ADMIN, UserRole.TEACHER)),
):
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="האימייל כבר קיים")

    student = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        role=UserRole.STUDENT,
        phone=body.phone,
        student_id=body.student_id,
        email_verified=True,
        email_verified_by_teacher=current.role == UserRole.TEACHER,
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student


@router.post("/{student_id}/verify-email-bypass")
async def verify_without_email(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    teacher: User = Depends(require_roles(UserRole.TEACHER)),
):
    """המורה מאשר תלמיד ללא אימות אימייל."""
    student = await db.get(User, student_id)
    if not student or student.role != UserRole.STUDENT:
        raise HTTPException(status_code=404, detail="תלמיד לא נמצא")
    from app.models.course import CourseEnrollment, CourseOffering

    enrolled = await db.execute(
        select(CourseEnrollment)
        .join(CourseOffering)
        .where(CourseEnrollment.student_id == student_id, CourseOffering.teacher_id == teacher.id)
    )
    if not enrolled.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="התלמיד לא בקורס שלך")
    student.email_verified_by_teacher = True
    student.email_verified = True
    await db.commit()
    return {"ok": True}
