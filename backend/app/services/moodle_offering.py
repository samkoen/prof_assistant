"""Création d'un cours local à partir d'un cours Moodle."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.moodle.calendar import clip_label, current_academic_year
from app.integrations.moodle.parse import MoodleCourse
from app.models.course import CourseCatalog, CourseOffering
from app.services.join_token_service import assign_join_token, expires_at_from_valid_days
from app.services.offering_access import ensure_owner_membership


async def create_offering_from_moodle(
    db: AsyncSession, teacher_id: int, course: MoodleCourse
) -> CourseOffering:
    catalog = await _catalog(db, teacher_id, course)
    offering = _offering(
        catalog.id, teacher_id, await _group_name(db, catalog.id, teacher_id, course)
    )
    db.add(offering)
    await db.flush()
    await ensure_owner_membership(db, offering)
    return offering


async def _catalog(db: AsyncSession, teacher_id: int, course: MoodleCourse) -> CourseCatalog:
    name = clip_label(course.fullname)
    existing = await db.scalar(
        select(CourseCatalog).where(
            CourseCatalog.teacher_id == teacher_id, CourseCatalog.name == name
        )
    )
    if existing is not None:
        return existing
    catalog = CourseCatalog(name=name, description=None, teacher_id=teacher_id)
    db.add(catalog)
    await db.flush()
    return catalog


async def _group_name(
    db: AsyncSession, catalog_id: int, teacher_id: int, course: MoodleCourse
) -> str:
    base = clip_label(course.shortname)
    if not await _group_taken(db, catalog_id, teacher_id, base):
        return base
    suffix = f" {course.id}"
    suffixed = f"{base[: 255 - len(suffix)]}{suffix}"
    if not await _group_taken(db, catalog_id, teacher_id, suffixed):
        return suffixed
    return clip_label(str(course.id))


async def _group_taken(db: AsyncSession, catalog_id: int, teacher_id: int, group_name: str) -> bool:
    year = current_academic_year()
    row = await db.scalar(
        select(CourseOffering.id).where(
            CourseOffering.catalog_course_id == catalog_id,
            CourseOffering.teacher_id == teacher_id,
            CourseOffering.academic_year == year,
            CourseOffering.semester == 1,
            CourseOffering.group_name == group_name,
        )
    )
    return row is not None


def _offering(catalog_id: int, teacher_id: int, group_name: str) -> CourseOffering:
    offering = CourseOffering(
        catalog_course_id=catalog_id,
        teacher_id=teacher_id,
        group_name=group_name,
        academic_year=current_academic_year(),
        semester=1,
        description=None,
        is_open_enrollment=True,
        auto_approve_enrollment=False,
        join_token="pending",
        join_token_expires_at=expires_at_from_valid_days(1),
    )
    assign_join_token(offering)
    return offering
