from fastapi import HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import CourseEnrollment, CourseOffering
from app.models.enums import EnrollmentStatus
from app.models.user import User
from app.schemas.course import JoinPreviewResponse
from app.services.enrollment_service import find_existing_enrollment
from app.services.join_token_service import ensure_join_link_valid, is_join_link_valid


def build_join_preview(
    offering: CourseOffering,
    enrollment: CourseEnrollment | None,
) -> JoinPreviewResponse:
    link_valid = is_join_link_valid(offering)
    return JoinPreviewResponse(
        offering_id=offering.id,
        catalog_name=offering.catalog_course.name,
        group_name=offering.group_name,
        academic_year=offering.academic_year,
        semester=offering.semester,
        teacher_name=offering.teacher.full_name,
        description=offering.description,
        is_open_enrollment=offering.is_open_enrollment and link_valid,
        auto_approve_enrollment=offering.auto_approve_enrollment,
        already_enrolled=enrollment is not None,
        enrollment_status=enrollment.status if enrollment else None,
        join_link_expired=not link_valid,
        join_token_expires_at=offering.join_token_expires_at,
    )


def ensure_offering_open_for_join(offering: CourseOffering | None) -> CourseOffering:
    if not offering or not offering.is_open_enrollment:
        raise HTTPException(status_code=404, detail="הקורס לא זמין להצטרפות")
    ensure_join_link_valid(offering)
    return offering


def ensure_no_existing_enrollment(enrollment: CourseEnrollment | None) -> None:
    if enrollment is None:
        return
    if enrollment.status == EnrollmentStatus.APPROVED:
        raise HTTPException(status_code=400, detail="כבר נרשמת לקורס")
    if enrollment.status == EnrollmentStatus.PENDING:
        raise HTTPException(status_code=400, detail="בקשת ההצטרפות כבר נשלחה")
    raise HTTPException(status_code=400, detail="כבר נרשמת לקורס")


async def join_preview_for_student(
    offering: CourseOffering, student: User, db: AsyncSession
) -> JoinPreviewResponse:
    enrollment = await find_existing_enrollment(offering.id, student.id, db)
    return build_join_preview(offering, enrollment)
