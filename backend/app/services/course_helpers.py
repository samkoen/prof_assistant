from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import CourseCatalog, CourseOffering
from app.models.enums import EnrollmentStatus
from app.models.exam import Exam
from app.models.exercise import Exercise
from app.schemas.catalog import CatalogCourseResponse
from app.schemas.course import CourseOfferingResponse


def offering_to_response(
    offering: CourseOffering,
    enrollment_status: EnrollmentStatus | None = None,
    *,
    include_join_link: bool = False,
) -> CourseOfferingResponse:
    return CourseOfferingResponse(
        id=offering.id,
        catalog_course_id=offering.catalog_course_id,
        catalog_name=offering.catalog_course.name,
        group_name=offering.group_name,
        academic_year=offering.academic_year,
        semester=offering.semester,
        description=offering.description,
        is_open_enrollment=offering.is_open_enrollment,
        auto_approve_enrollment=offering.auto_approve_enrollment,
        teacher_name=offering.teacher.full_name,
        created_at=offering.created_at,
        enrollment_status=enrollment_status,
        join_token=offering.join_token if include_join_link else None,
        join_token_expires_at=offering.join_token_expires_at if include_join_link else None,
    )


async def catalog_to_response(catalog: CourseCatalog, db: AsyncSession) -> CatalogCourseResponse:
    exam_count = await db.scalar(
        select(func.count()).select_from(Exam).where(Exam.catalog_course_id == catalog.id)
    )
    exercise_count = await db.scalar(
        select(func.count()).select_from(Exercise).where(Exercise.catalog_course_id == catalog.id)
    )
    teacher_name = catalog.teacher.full_name if catalog.teacher else ""
    return CatalogCourseResponse(
        id=catalog.id,
        name=catalog.name,
        description=catalog.description,
        teacher_id=catalog.teacher_id,
        teacher_name=teacher_name,
        exam_count=exam_count or 0,
        exercise_count=exercise_count or 0,
        created_at=catalog.created_at,
    )
