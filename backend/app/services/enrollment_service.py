from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course import CourseEnrollment, CourseOffering
from app.models.enums import EnrollmentStatus, NotificationType, UserRole
from app.models.notification import Notification
from app.models.user import User
from app.schemas.course import EnrollmentResponse


def enrollment_to_response(enrollment: CourseEnrollment, student: User) -> EnrollmentResponse:
    return EnrollmentResponse(
        id=enrollment.id,
        offering_id=enrollment.offering_id,
        student_id=student.id,
        student_name=student.full_name,
        student_email=student.email,
        status=enrollment.status,
        created_at=enrollment.created_at,
    )


def enrollment_to_response_with_offering(
    enrollment: CourseEnrollment, student: User, offering: CourseOffering
) -> EnrollmentResponse:
    catalog_name = offering.catalog_course.name if offering.catalog_course else None
    return EnrollmentResponse(
        id=enrollment.id,
        offering_id=enrollment.offering_id,
        student_id=student.id,
        student_name=student.full_name,
        student_email=student.email,
        status=enrollment.status,
        created_at=enrollment.created_at,
        catalog_name=catalog_name,
        group_name=offering.group_name,
        academic_year=offering.academic_year,
        semester=offering.semester,
    )


async def find_existing_enrollment(
    offering_id: int, student_id: int, db: AsyncSession
) -> CourseEnrollment | None:
    result = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.offering_id == offering_id,
            CourseEnrollment.student_id == student_id,
        )
    )
    return result.scalar_one_or_none()


def resolve_initial_enrollment_status(offering: CourseOffering) -> EnrollmentStatus:
    if offering.auto_approve_enrollment:
        return EnrollmentStatus.APPROVED
    return EnrollmentStatus.PENDING


async def notify_student_enrollment_approved(
    db: AsyncSession, student_id: int, offering_id: int
) -> None:
    db.add(
        Notification(
            user_id=student_id,
            type=NotificationType.ENROLLMENT_APPROVED,
            title="נרשמת לקורס",
            body="ההצטרפות לקורס אושרה",
            related_offering_id=offering_id,
        )
    )


async def notify_teacher_enrollment_request(
    db: AsyncSession, teacher_id: int, student: User, offering: CourseOffering
) -> None:
    db.add(
        Notification(
            user_id=teacher_id,
            type=NotificationType.ENROLLMENT_REQUESTED,
            title="בקשת הצטרפות חדשה",
            body=f"{student.full_name} מבקש/ת להצטרף ל-{offering.group_name}",
            related_offering_id=offering.id,
        )
    )


async def create_student_enrollment(
    db: AsyncSession, student: User, offering: CourseOffering
) -> CourseEnrollment:
    status = resolve_initial_enrollment_status(offering)
    enrollment = CourseEnrollment(
        offering_id=offering.id,
        student_id=student.id,
        status=status,
    )
    db.add(enrollment)
    if status == EnrollmentStatus.APPROVED:
        await notify_student_enrollment_approved(db, student.id, offering.id)
    else:
        await notify_teacher_enrollment_request(db, offering.teacher_id, student, offering)
    return enrollment


async def load_offering_for_join(offering_id: int, db: AsyncSession) -> CourseOffering | None:
    result = await db.execute(
        select(CourseOffering)
        .options(
            selectinload(CourseOffering.catalog_course),
            selectinload(CourseOffering.teacher),
        )
        .where(CourseOffering.id == offering_id)
    )
    return result.scalar_one_or_none()


def student_can_request_enrollment(student: User) -> bool:
    return student.role == UserRole.STUDENT


async def find_sibling_enrollment(
    db: AsyncSession,
    student_id: int,
    offering: CourseOffering,
    *,
    exclude_offering_id: int | None = None,
) -> CourseEnrollment | None:
    oid = exclude_offering_id if exclude_offering_id is not None else offering.id
    result = await db.execute(
        select(CourseEnrollment)
        .join(CourseOffering, CourseEnrollment.offering_id == CourseOffering.id)
        .options(selectinload(CourseEnrollment.offering))
        .where(
            CourseEnrollment.student_id == student_id,
            CourseOffering.catalog_course_id == offering.catalog_course_id,
            CourseOffering.academic_year == offering.academic_year,
            CourseOffering.semester == offering.semester,
            CourseOffering.id != oid,
            CourseEnrollment.status.in_(
                (EnrollmentStatus.APPROVED, EnrollmentStatus.PENDING)
            ),
        )
    )
    return result.scalar_one_or_none()


def ensure_no_sibling_enrollment_conflict(sibling: CourseEnrollment | None) -> None:
    if not sibling:
        return
    if sibling.status == EnrollmentStatus.APPROVED:
        raise HTTPException(
            status_code=400,
            detail="כבר רשום/ה לקבוצה אחרת בקורס זה (אותה שנה וסמסטר)",
        )
    raise HTTPException(
        status_code=400,
        detail="קיימת בקשת הרשמה לקבוצה אחרת בקורס זה",
    )


async def reject_sibling_pending_enrollments(
    db: AsyncSession, student_id: int, offering: CourseOffering
) -> None:
    result = await db.execute(
        select(CourseEnrollment)
        .join(CourseOffering, CourseEnrollment.offering_id == CourseOffering.id)
        .where(
            CourseEnrollment.student_id == student_id,
            CourseOffering.catalog_course_id == offering.catalog_course_id,
            CourseOffering.academic_year == offering.academic_year,
            CourseOffering.semester == offering.semester,
            CourseOffering.id != offering.id,
            CourseEnrollment.status == EnrollmentStatus.PENDING,
        )
    )
    for enrollment in result.scalars().all():
        enrollment.status = EnrollmentStatus.REJECTED


def dedupe_approved_offerings_by_session(
    rows: list[tuple[CourseOffering, EnrollmentStatus, object]],
) -> list[tuple[CourseOffering, EnrollmentStatus]]:
    """Une seule הרצה approuvée par cours/année/semestre (garde l'inscription la plus ancienne)."""
    best: dict[tuple[int, int, int], tuple[CourseOffering, EnrollmentStatus, object]] = {}
    for offering, status, enrolled_at in rows:
        if status != EnrollmentStatus.APPROVED:
            continue
        key = (offering.catalog_course_id, offering.academic_year, offering.semester)
        prev = best.get(key)
        if prev is None or enrolled_at < prev[2]:
            best[key] = (offering, status, enrolled_at)
    return [(offering, status) for offering, status, _ in best.values()]


async def load_student_enrolled_session_keys(
    db: AsyncSession, student_id: int
) -> set[tuple[int, int, int]]:
    result = await db.execute(
        select(
            CourseOffering.catalog_course_id,
            CourseOffering.academic_year,
            CourseOffering.semester,
        )
        .join(CourseEnrollment, CourseEnrollment.offering_id == CourseOffering.id)
        .where(
            CourseEnrollment.student_id == student_id,
            CourseEnrollment.status.in_(
                (EnrollmentStatus.APPROVED, EnrollmentStatus.PENDING)
            ),
        )
    )
    return {(row[0], row[1], row[2]) for row in result.all()}
