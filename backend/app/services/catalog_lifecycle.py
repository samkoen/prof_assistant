"""Modification et suppression d'un cours catalogue."""

from fastapi import HTTPException
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import CourseCatalog, CourseOffering
from app.models.exam import Exam
from app.models.exercise import Exercise
from app.models.teacher_share import TeacherContentShare
from app.schemas.catalog import CatalogCourseUpdate

_EMPTY_NAME = "יש למלא שם קורס"
_NO_FIELDS = "אין שדות לעדכון"
_IN_USE = "לא ניתן למחוק קורס קטלוג שמשויכים אליו מבחנים, תרגילים או קבוצות"


def normalized_catalog_update(body: CatalogCourseUpdate) -> dict:
    """Champs fournis, noms vides refusés, description blanche effacée."""
    fields: dict = {}
    if body.name is not None:
        name = body.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail=_EMPTY_NAME)
        fields["name"] = name
    if body.description is not None:
        text = body.description.strip()
        fields["description"] = text or None
    if not fields:
        raise HTTPException(status_code=400, detail=_NO_FIELDS)
    return fields


def apply_catalog_fields(catalog: CourseCatalog, fields: dict) -> None:
    if "name" in fields:
        catalog.name = fields["name"]
    if "description" in fields:
        catalog.description = fields["description"]


def refuse_if_catalog_in_use(exams: int, exercises: int, offerings: int) -> None:
    if exams or exercises or offerings:
        raise HTTPException(status_code=400, detail=_IN_USE)


async def _count(db: AsyncSession, model, catalog_id: int) -> int:
    count = await db.scalar(
        select(func.count()).select_from(model).where(model.catalog_course_id == catalog_id)
    )
    return int(count or 0)


async def catalog_linked_counts(db: AsyncSession, catalog_id: int) -> tuple[int, int, int]:
    exams = await _count(db, Exam, catalog_id)
    exercises = await _count(db, Exercise, catalog_id)
    offerings = await _count(db, CourseOffering, catalog_id)
    return exams, exercises, offerings


async def delete_catalog_shares(db: AsyncSession, catalog_id: int) -> None:
    await db.execute(
        delete(TeacherContentShare).where(
            or_(
                TeacherContentShare.source_catalog_id == catalog_id,
                TeacherContentShare.target_catalog_id == catalog_id,
            )
        )
    )
