from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.course import CourseCatalog, CourseEnrollment, CourseOffering
from app.models.enums import EnrollmentStatus, UserRole
from app.models.notification import Notification
from app.models.enums import NotificationType
from app.models.user import User
from app.schemas.course import (
    CourseOfferingCreate,
    CourseOfferingResponse,
    EnrollmentRequest,
    EnrollmentResponse,
    EnrollmentReview,
)
from app.schemas.student import AddStudentToCourseRequest, CourseEnrollmentDetail
from app.services.course_helpers import offering_to_response

router = APIRouter(tags=["courses"])


async def _teacher_owns_offering(offering_id: int, teacher_id: int, db: AsyncSession) -> CourseOffering:
    result = await db.execute(
        select(CourseOffering).where(CourseOffering.id == offering_id, CourseOffering.teacher_id == teacher_id)
    )
    offering = result.scalar_one_or_none()
    if not offering:
        raise HTTPException(status_code=404, detail="קורס לא נמצא")
    return offering


def _offering_query():
    return select(CourseOffering).options(
        selectinload(CourseOffering.catalog_course),
        selectinload(CourseOffering.teacher),
    )


@router.post("/courses", response_model=CourseOfferingResponse)
async def create_offering(
    body: CourseOfferingCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    catalog = await db.get(CourseCatalog, body.catalog_course_id)
    if not catalog:
        raise HTTPException(status_code=404, detail="קורס קטלוג לא נמצא")
    if user.role == UserRole.TEACHER and catalog.created_by_id != user.id:
        raise HTTPException(status_code=403, detail="אין הרשאה לקורס קטלוג זה")

    teacher_id = user.id
    offering = CourseOffering(
        catalog_course_id=body.catalog_course_id,
        teacher_id=teacher_id,
        group_name=body.group_name,
        academic_year=body.academic_year,
        semester=body.semester,
        description=body.description,
        is_open_enrollment=body.is_open_enrollment,
    )
    db.add(offering)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="הרצה זו כבר קיימת (אותו קורס, שנה, סמסטר וקבוצה)",
        )
    result = await db.execute(_offering_query().where(CourseOffering.id == offering.id))
    return offering_to_response(result.scalar_one())


@router.get("/courses/{offering_id}/enrollments", response_model=list[CourseEnrollmentDetail])
async def list_offering_enrollments(
    offering_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    if user.role == UserRole.TEACHER:
        await _teacher_owns_offering(offering_id, user.id, db)
    result = await db.execute(
        select(CourseEnrollment)
        .options(selectinload(CourseEnrollment.student))
        .where(CourseEnrollment.offering_id == offering_id)
        .order_by(CourseEnrollment.created_at.desc())
    )
    rows = result.scalars().all()
    return [
        CourseEnrollmentDetail(
            id=e.id,
            offering_id=e.offering_id,
            student_id=e.student_id,
            student_name=e.student.full_name,
            student_email=e.student.email,
            status=e.status,
            created_at=e.created_at,
        )
        for e in rows
    ]


@router.post("/courses/{offering_id}/enrollments", response_model=EnrollmentResponse)
async def add_student_to_offering(
    offering_id: int,
    body: AddStudentToCourseRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    if user.role == UserRole.TEACHER:
        await _teacher_owns_offering(offering_id, user.id, db)
    else:
        offering = await db.get(CourseOffering, offering_id)
        if not offering:
            raise HTTPException(status_code=404, detail="קורס לא נמצא")

    student = await db.get(User, body.student_id)
    if not student or student.role != UserRole.STUDENT:
        raise HTTPException(status_code=400, detail="תלמיד לא נמצא")

    existing = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.offering_id == offering_id,
            CourseEnrollment.student_id == body.student_id,
        )
    )
    enr = existing.scalar_one_or_none()
    if enr:
        if enr.status == EnrollmentStatus.APPROVED:
            raise HTTPException(status_code=400, detail="התלמיד כבר רשום לקורס")
        enr.status = EnrollmentStatus.APPROVED
        await db.commit()
        await db.refresh(enr)
        return EnrollmentResponse(
            id=enr.id,
            offering_id=enr.offering_id,
            student_id=enr.student_id,
            student_name=student.full_name,
            student_email=student.email,
            status=enr.status,
            created_at=enr.created_at,
        )

    enrollment = CourseEnrollment(
        offering_id=offering_id,
        student_id=body.student_id,
        status=EnrollmentStatus.APPROVED,
    )
    db.add(enrollment)
    db.add(
        Notification(
            user_id=student.id,
            type=NotificationType.ENROLLMENT_APPROVED,
            title="נרשמת לקורס",
            body="נוספת לקורס על ידי המורה",
            related_offering_id=offering_id,
        )
    )
    await db.commit()
    await db.refresh(enrollment)
    return EnrollmentResponse(
        id=enrollment.id,
        offering_id=enrollment.offering_id,
        student_id=student.id,
        student_name=student.full_name,
        student_email=student.email,
        status=enrollment.status,
        created_at=enrollment.created_at,
    )


@router.delete("/enrollments/{enrollment_id}")
async def remove_student_from_offering(
    enrollment_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    result = await db.execute(
        select(CourseEnrollment)
        .options(
            selectinload(CourseEnrollment.student),
            selectinload(CourseEnrollment.offering),
        )
        .where(CourseEnrollment.id == enrollment_id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="רישום לא נמצא")
    if user.role == UserRole.TEACHER and enrollment.offering.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="אין הרשאה")

    await db.delete(enrollment)
    await db.commit()
    return {"ok": True}


@router.get("/courses/mine", response_model=list[CourseOfferingResponse])
async def my_offerings(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = _offering_query()
    if user.role == UserRole.TEACHER:
        q = q.where(CourseOffering.teacher_id == user.id)
    elif user.role == UserRole.STUDENT:
        q = q.join(CourseEnrollment).where(
            CourseEnrollment.student_id == user.id,
            CourseEnrollment.status == EnrollmentStatus.APPROVED,
        )
    else:
        q = q.order_by(CourseOffering.created_at.desc())
    result = await db.execute(q)
    return [offering_to_response(o) for o in result.scalars().unique().all()]


@router.get("/courses/open", response_model=list[CourseOfferingResponse])
async def open_offerings(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(
        _offering_query().where(CourseOffering.is_open_enrollment.is_(True))
    )
    return [offering_to_response(o) for o in result.scalars().all()]


@router.post("/enrollments/request", response_model=EnrollmentResponse)
async def request_enrollment(
    body: EnrollmentRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    offering = await db.get(CourseOffering, body.offering_id)
    if not offering or not offering.is_open_enrollment:
        raise HTTPException(status_code=404, detail="הקורס לא זמין")
    existing = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.offering_id == body.offering_id,
            CourseEnrollment.student_id == user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="כבר נרשמת לקורס")
    enrollment = CourseEnrollment(
        offering_id=body.offering_id,
        student_id=user.id,
        status=EnrollmentStatus.PENDING,
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return EnrollmentResponse(
        id=enrollment.id,
        offering_id=enrollment.offering_id,
        student_id=user.id,
        student_name=user.full_name,
        student_email=user.email,
        status=enrollment.status,
        created_at=enrollment.created_at,
    )


@router.get("/enrollments/pending", response_model=list[EnrollmentResponse])
async def pending_enrollments(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    result = await db.execute(
        select(CourseEnrollment)
        .join(CourseOffering)
        .options(selectinload(CourseEnrollment.student))
        .where(
            CourseOffering.teacher_id == user.id,
            CourseEnrollment.status == EnrollmentStatus.PENDING,
        )
    )
    enrollments = result.scalars().all()
    return [
        EnrollmentResponse(
            id=e.id,
            offering_id=e.offering_id,
            student_id=e.student_id,
            student_name=e.student.full_name,
            student_email=e.student.email,
            status=e.status,
            created_at=e.created_at,
        )
        for e in enrollments
    ]


@router.patch("/enrollments/{enrollment_id}", response_model=EnrollmentResponse)
async def review_enrollment(
    enrollment_id: int,
    body: EnrollmentReview,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    result = await db.execute(
        select(CourseEnrollment)
        .join(CourseOffering)
        .options(selectinload(CourseEnrollment.student))
        .where(CourseEnrollment.id == enrollment_id, CourseOffering.teacher_id == user.id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="בקשה לא נמצאה")
    enrollment.status = body.status
    db.add(
        Notification(
            user_id=enrollment.student_id,
            type=(
                NotificationType.ENROLLMENT_APPROVED
                if body.status == EnrollmentStatus.APPROVED
                else NotificationType.ENROLLMENT_REJECTED
            ),
            title="עדכון הרשמה לקורס",
            body="הבקשה שלך אושרה" if body.status == EnrollmentStatus.APPROVED else "הבקשה שלך נדחתה",
            related_offering_id=enrollment.offering_id,
        )
    )
    await db.commit()
    await db.refresh(enrollment)
    return EnrollmentResponse(
        id=enrollment.id,
        offering_id=enrollment.offering_id,
        student_id=enrollment.student_id,
        student_name=enrollment.student.full_name,
        student_email=enrollment.student.email,
        status=enrollment.status,
        created_at=enrollment.created_at,
    )
