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
