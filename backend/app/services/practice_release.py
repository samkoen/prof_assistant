"""Envoi d'un תרגול ou d'une משימה aux élèves, et blocage de la note."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import CourseOffering
from app.models.enums import ExamStatus
from app.models.exam import Exam, ExamSession, Question, StudentExamAttempt
from app.models.task import TaskStep
from app.schemas.task import TaskReviewOut
from app.services.catalog_scope import catalog_item_matches_offering
from app.services.exam_group_removal import assert_not_excluded
from app.services.exam_kind import is_task, is_tirgoul
from app.services.exam_lifecycle import ensure_draft_session, notify_exam_available_to_pending_students

_DEPLOY_ERRORS = {
    "not_practice": "רק תרגול או משימה נשלחים כך",
    "empty": "יש להוסיף תוכן לפני השליחה לתלמידים",
    "closed": "המפגש סגור",
    "already": "כבר נשלח לתלמידים",
}
_BLOCK_ERRORS = {
    "not_practice": "רק תרגול או משימה ניתנים לחסימה",
    "unavailable": "אפשר לחסום ציון רק אחרי השליחה לתלמידים",
}


def is_student_practice(exam: Exam | None) -> bool:
    return is_tirgoul(exam) or is_task(exam)


def deploy_block_reason(exam: Exam, session: ExamSession, content_count: int) -> str | None:
    if not is_student_practice(exam) or exam.private_student_id:
        return "not_practice"
    if content_count < 1:
        return "empty"
    if session.status == ExamStatus.CLOSED:
        return "closed"
    if session.status == ExamStatus.ACTIVE and not session.grading_locked:
        return "already"
    return None


def block_reason(exam: Exam, session: ExamSession) -> str | None:
    if not is_student_practice(exam):
        return "not_practice"
    if session.status != ExamStatus.ACTIVE or session.grading_locked:
        return "unavailable"
    return None


def should_record_score(session: ExamSession) -> bool:
    return not bool(getattr(session, "grading_locked", False))


def write_official_score(attempt: StudentExamAttempt, total: float, maximum: float, *, record: bool) -> None:
    if not record:
        return
    attempt.score = total
    attempt.max_score = maximum


def write_practice_score(attempt: StudentExamAttempt, total: float, maximum: float, *, record: bool) -> None:
    if not record:
        return
    attempt.practice_score = total
    attempt.practice_max_score = maximum


def withhold_student_grade(session: ExamSession, attempt: StudentExamAttempt) -> bool:
    return bool(session.grading_locked) and attempt.score is None


def without_grades(rows: list[TaskReviewOut]) -> list[TaskReviewOut]:
    return [row.model_copy(update={"score": None, "ai_score": None, "verdict": None}) for row in rows]


def mark_deployed(session: ExamSession, now: datetime) -> bool:
    """Passe la session en actif. True si c'est le premier envoi (brouillon)."""
    first = session.status == ExamStatus.DRAFT
    session.status = ExamStatus.ACTIVE
    session.grading_locked = False
    session.integrity_mode_enabled = False
    if first:
        session.activated_at = now
    return first


def mark_grading_locked(session: ExamSession) -> None:
    session.grading_locked = True


def _reject(reason: str | None, messages: dict[str, str]) -> None:
    if reason:
        raise HTTPException(status_code=400, detail=messages[reason])


async def practice_content_count(exam: Exam, db: AsyncSession) -> int:
    if is_task(exam):
        counted = await db.scalar(select(func.count()).select_from(TaskStep).where(TaskStep.exam_id == exam.id))
    else:
        counted = await db.scalar(select(func.count()).select_from(Question).where(Question.exam_id == exam.id))
    return int(counted or 0)


async def deploy_session(session: ExamSession, exam: Exam, db: AsyncSession) -> None:
    count = await practice_content_count(exam, db)
    _reject(deploy_block_reason(exam, session, count), _DEPLOY_ERRORS)
    if mark_deployed(session, datetime.now(timezone.utc)):
        await notify_exam_available_to_pending_students(session, exam, db)


async def block_session(session: ExamSession, exam: Exam) -> None:
    _reject(block_reason(exam, session), _BLOCK_ERRORS)
    mark_grading_locked(session)


async def deploy_exam_on_offering(exam: Exam, offering: CourseOffering, db: AsyncSession) -> ExamSession:
    if offering.catalog_course_id != exam.catalog_course_id:
        raise HTTPException(status_code=400, detail="הרצת קורס לא תואמת למטלה")
    if not catalog_item_matches_offering(exam, offering):
        raise HTTPException(status_code=400, detail="המטלה לא מיועדת להרצה זו")
    await assert_not_excluded(db, exam.id, offering.id)
    session = await ensure_draft_session(exam.id, offering.id, db)
    await deploy_session(session, exam, db)
    return session
