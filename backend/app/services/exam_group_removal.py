"""Retirer un examen d'un groupe sans l'effacer des autres groupes."""

from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import CourseOffering
from app.models.exam import Exam, ExamOfferingExclusion, ExamSession, StudentExamAttempt
from app.services.catalog_scope import catalog_item_matches_offering
from app.services.exam_lifecycle import delete_attempt_records, delete_exam_cascade

_WRONG_OFFERING = "הרצת קורס לא תואמת למטלה"
_NOT_FOR_GROUP = "המטלה לא מיועדת להרצה זו"
_ALREADY_REMOVED = "המטלה הוסרה מהקבוצה הזו"


def keeps_catalog_exam(other_group_count: int) -> bool:
    """Un examen partagé reste dans le catalogue. Un examen de ce seul groupe est supprimé."""
    return other_group_count > 0


def without_excluded(exams: list, excluded_ids: set[int]) -> list:
    return [exam for exam in exams if exam.id not in excluded_ids]


async def excluded_exam_ids(db: AsyncSession, offering_id: int) -> set[int]:
    rows = await db.execute(
        select(ExamOfferingExclusion.exam_id).where(ExamOfferingExclusion.offering_id == offering_id)
    )
    return set(rows.scalars().all())


async def offering_ids_excluding_exam(db: AsyncSession, exam_id: int) -> set[int]:
    rows = await db.execute(
        select(ExamOfferingExclusion.offering_id).where(ExamOfferingExclusion.exam_id == exam_id)
    )
    return set(rows.scalars().all())


async def assert_not_excluded(db: AsyncSession, exam_id: int, offering_id: int) -> None:
    if offering_id in await offering_ids_excluding_exam(db, exam_id):
        raise HTTPException(status_code=400, detail=_ALREADY_REMOVED)


async def _other_visible_groups(exam: Exam, offering: CourseOffering, db: AsyncSession) -> list[CourseOffering]:
    rows = await db.execute(
        select(CourseOffering).where(
            CourseOffering.catalog_course_id == exam.catalog_course_id,
            CourseOffering.id != offering.id,
        )
    )
    hidden = await offering_ids_excluding_exam(db, exam.id)
    return [
        group
        for group in rows.scalars().all()
        if group.id not in hidden and catalog_item_matches_offering(exam, group)
    ]


async def _hide_from_group(exam_id: int, offering_id: int, db: AsyncSession) -> None:
    db.add(ExamOfferingExclusion(exam_id=exam_id, offering_id=offering_id))
    await db.flush()


async def _drop_group_session(exam_id: int, offering_id: int, db: AsyncSession) -> None:
    session = (
        await db.execute(
            select(ExamSession).where(ExamSession.exam_id == exam_id, ExamSession.offering_id == offering_id)
        )
    ).scalar_one_or_none()
    if not session:
        return
    attempts = (
        await db.execute(select(StudentExamAttempt).where(StudentExamAttempt.exam_session_id == session.id))
    ).scalars().all()
    for attempt in attempts:
        await delete_attempt_records(attempt, db)
    await db.delete(session)


async def _hide_shared_exam(exam: Exam, offering: CourseOffering, db: AsyncSession) -> None:
    await _hide_from_group(exam.id, offering.id, db)
    await _drop_group_session(exam.id, offering.id, db)


async def remove_exam_from_group(exam: Exam, offering: CourseOffering, db: AsyncSession) -> None:
    if offering.catalog_course_id != exam.catalog_course_id:
        raise HTTPException(status_code=400, detail=_WRONG_OFFERING)
    if not catalog_item_matches_offering(exam, offering):
        raise HTTPException(status_code=400, detail=_NOT_FOR_GROUP)
    if offering.id in await offering_ids_excluding_exam(db, exam.id):
        return
    others = await _other_visible_groups(exam, offering, db)
    if keeps_catalog_exam(len(others)):
        await _hide_shared_exam(exam, offering, db)
        return
    await db.execute(delete(ExamOfferingExclusion).where(ExamOfferingExclusion.exam_id == exam.id))
    await delete_exam_cascade(exam.id, db)
