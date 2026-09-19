from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course import CourseCatalog, CourseOffering
from app.models.enums import EnrollmentStatus
from app.models.exam import Exam
from app.models.exercise import Exercise
from app.models.offering_teacher import OfferingTeacher
from app.schemas.catalog import CatalogCourseResponse
from app.schemas.course import CourseOfferingResponse
from app.services.offering_teacher_service import teacher_refs_from_members


def offering_eager_options():
    return (
        selectinload(CourseOffering.catalog_course),
        selectinload(CourseOffering.teacher),
        selectinload(CourseOffering.teacher_members).selectinload(OfferingTeacher.teacher),
    )


def offering_to_response(
    offering: CourseOffering,
    enrollment_status: EnrollmentStatus | None = None,
    *,
    include_join_link: bool = False,
) -> CourseOfferingResponse:
    teachers = teacher_refs_from_members(list(offering.teacher_members or []), offering)
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
        teachers=teachers,
        created_at=offering.created_at,
        enrollment_status=enrollment_status,
        join_token=offering.join_token if include_join_link else None,
        join_token_expires_at=offering.join_token_expires_at if include_join_link else None,
    )


async def catalog_to_response(catalog: CourseCatalog, db: AsyncSession) -> CatalogCourseResponse:
    counts = await catalogs_to_responses([catalog], db)
    return counts[0]


async def catalogs_to_responses(
    catalogs: list[CourseCatalog], db: AsyncSession
) -> list[CatalogCourseResponse]:
    if not catalogs:
        return []
    catalog_ids = [c.id for c in catalogs]
    exam_counts = await _count_by_catalog(Exam, catalog_ids, db)
    exercise_counts = await _count_by_catalog(Exercise, catalog_ids, db)
    return [
        CatalogCourseResponse(
            id=catalog.id,
            name=catalog.name,
            description=catalog.description,
            teacher_id=catalog.teacher_id,
            teacher_name=catalog.teacher.full_name if catalog.teacher else "",
            exam_count=exam_counts.get(catalog.id, 0),
            exercise_count=exercise_counts.get(catalog.id, 0),
            created_at=catalog.created_at,
        )
        for catalog in catalogs
    ]


async def _count_by_catalog(model, catalog_ids: list[int], db: AsyncSession) -> dict[int, int]:
    rows = await db.execute(
        select(model.catalog_course_id, func.count())
        .where(model.catalog_course_id.in_(catalog_ids))
        .group_by(model.catalog_course_id)
    )
    return {cid: int(cnt) for cid, cnt in rows.all()}
