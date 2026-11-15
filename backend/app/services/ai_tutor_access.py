"""Garde-fous serveur du tuteur IA : jamais pendant l'examen, seulement quand la correction est visible."""

from dataclasses import dataclass

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models.exam import Answer, Exam, ExamSession, PracticeAnswer, Question, StudentExamAttempt
from app.models.user import User
from app.services.ai_explanation import _student_approved
from app.services.exam_kind import student_sees_official_results
from app.services.exam_visibility import ensure_student_can_see_exam


@dataclass(frozen=True)
class TutorContext:
    attempt: StudentExamAttempt
    exam: Exam
    question: Question
    selected_ids: list[int]
    text_answer: str | None
    for_practice: bool


def tutor_enabled_for(exam: Exam) -> bool:
    return bool(settings.ai_tutor_enabled and exam.ai_tutor_enabled and exam.show_detailed_correction)


def tutor_block_reason(
    exam: Exam, session: ExamSession, attempt: StudentExamAttempt | None, *, for_practice: bool
) -> str | None:
    """None si l'élève peut discuter avec le tuteur ; sinon le message d'erreur (hébreu)."""
    if not tutor_enabled_for(exam):
        return "העוזר החכם אינו זמין במטלה זו"
    if attempt is None or not attempt.submitted_at:
        return "העוזר החכם זמין רק אחרי הגשה"
    if for_practice:
        if attempt.practice_active or not attempt.practice_submitted_at:
            return "העוזר החכם זמין רק אחרי סיום התרגול"
        return None
    if not student_sees_official_results(exam, session):
        return "העוזר החכם יהיה זמין אחרי פרסום התוצאות"
    return None


async def _load_session(session_id: int, db: AsyncSession) -> ExamSession:
    row = await db.execute(
        select(ExamSession)
        .options(selectinload(ExamSession.exam).selectinload(Exam.catalog_course))
        .where(ExamSession.id == session_id)
    )
    session = row.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="מבחן לא נמצא")
    return session


async def _load_attempt(session_id: int, student_id: int, db: AsyncSession) -> StudentExamAttempt | None:
    row = await db.execute(
        select(StudentExamAttempt).where(
            StudentExamAttempt.exam_session_id == session_id,
            StudentExamAttempt.student_id == student_id,
        )
    )
    return row.scalar_one_or_none()


async def _load_question(question_id: int, exam_id: int, db: AsyncSession) -> Question:
    row = await db.execute(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.id == question_id, Question.exam_id == exam_id)
    )
    question = row.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="שאלה לא נמצאה")
    return question


async def _load_answer(attempt_id: int, question_id: int, for_practice: bool, db: AsyncSession):
    model = PracticeAnswer if for_practice else Answer
    row = await db.execute(
        select(model).where(model.attempt_id == attempt_id, model.question_id == question_id)
    )
    return row.scalar_one_or_none()


async def load_tutor_context(
    session_id: int, question_id: int, user: User, db: AsyncSession, *, for_practice: bool
) -> TutorContext:
    session = await _load_session(session_id, db)
    if not await _student_approved(session.offering_id, user, db):
        raise HTTPException(status_code=403, detail="אין גישה")
    ensure_student_can_see_exam(session.exam, user.id)
    attempt = await _load_attempt(session.id, user.id, db)
    reason = tutor_block_reason(session.exam, session, attempt, for_practice=for_practice)
    if reason:
        raise HTTPException(status_code=403, detail=reason)
    question = await _load_question(question_id, session.exam.id, db)
    answer = await _load_answer(attempt.id, question.id, for_practice, db)
    return TutorContext(
        attempt=attempt,
        exam=session.exam,
        question=question,
        selected_ids=list(answer.selected_option_ids or []) if answer else [],
        text_answer=(answer.text_answer if answer else None),
        for_practice=for_practice,
    )
