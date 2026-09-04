"""Soumission et notation d'une tentative d'examen."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course import CourseEnrollment
from app.models.enums import EnrollmentStatus, ExamStatus
from app.models.exam import (
    Answer,
    Exam,
    ExamSession,
    OpenAnswerEvaluation,
    Question,
    QuestionAiExplanation,
    StudentExamAttempt,
)
from app.models.enums import QuestionType
from app.schemas.exam import SubmitAnswerItem
from app.services.exam_kind import is_tirgoul
from app.services.scoring import score_exam_answers
from app.services.utc_time import as_utc


def persist_fields_for_answer(item: SubmitAnswerItem, question: Question) -> dict:
    if question.question_type == QuestionType.OPEN:
        text = (item.text_answer or "").strip() or None
        return {"selected_option_ids": [], "text_answer": text}
    return {"selected_option_ids": list(item.selected_option_ids or []), "text_answer": None}


async def _questions_by_id(exam_id: int, db: AsyncSession) -> dict[int, Question]:
    result = await db.execute(
        select(Question).options(selectinload(Question.options)).where(Question.exam_id == exam_id)
    )
    return {q.id: q for q in result.scalars().all()}


async def empty_answer_items(exam_id: int, db: AsyncSession) -> list[SubmitAnswerItem]:
    result = await db.execute(select(Question.id).where(Question.exam_id == exam_id))
    return [SubmitAnswerItem(question_id=qid) for qid in result.scalars()]


async def draft_answer_items(attempt_id: int, exam_id: int, db: AsyncSession) -> list[SubmitAnswerItem]:
    """Réponses brouillon en base + vide pour les questions sans brouillon."""
    saved_result = await db.execute(select(Answer).where(Answer.attempt_id == attempt_id))
    saved = {
        a.question_id: (list(a.selected_option_ids or []), a.text_answer)
        for a in saved_result.scalars()
    }
    q_result = await db.execute(select(Question.id).where(Question.exam_id == exam_id))
    return [
        SubmitAnswerItem(
            question_id=qid,
            selected_option_ids=saved[qid][0] if qid in saved else [],
            text_answer=saved[qid][1] if qid in saved else None,
        )
        for qid in q_result.scalars()
    ]


async def save_draft_answers(
    attempt: StudentExamAttempt,
    exam: Exam,
    answer_items: list[SubmitAnswerItem],
    db: AsyncSession,
) -> None:
    if attempt.submitted_at:
        raise HTTPException(status_code=400, detail="כבר הוגש")
    questions = await _questions_by_id(exam.id, db)
    existing_result = await db.execute(select(Answer).where(Answer.attempt_id == attempt.id))
    by_q = {a.question_id: a for a in existing_result.scalars()}
    for item in answer_items:
        if item.question_id not in questions:
            continue
        row = by_q.get(item.question_id)
        fields = persist_fields_for_answer(item, questions[item.question_id])
        if row:
            row.selected_option_ids = fields["selected_option_ids"]
            row.text_answer = fields["text_answer"]
        else:
            db.add(
                Answer(
                    attempt_id=attempt.id,
                    question_id=item.question_id,
                    **fields,
                )
            )
    await db.flush()


async def _delete_attempt_rows(model, attempt_id: int, db: AsyncSession) -> None:
    rows = await db.execute(select(model).where(model.attempt_id == attempt_id))
    for row in rows.scalars():
        await db.delete(row)


async def restart_resubmit_attempt(attempt: StudentExamAttempt, db: AsyncSession) -> None:
    if not attempt.can_resubmit:
        return
    await _delete_attempt_rows(Answer, attempt.id, db)
    await _delete_attempt_rows(QuestionAiExplanation, attempt.id, db)
    await _delete_attempt_rows(OpenAnswerEvaluation, attempt.id, db)
    attempt.submitted_at = None
    attempt.score = None
    attempt.max_score = None


async def _close_session_if_all_done(session: ExamSession, exam: Exam, db: AsyncSession) -> None:
    if is_tirgoul(exam):
        return
    enrolled = await db.scalar(
        select(func.count())
        .select_from(CourseEnrollment)
        .where(
            CourseEnrollment.offering_id == session.offering_id,
            CourseEnrollment.status == EnrollmentStatus.APPROVED,
        )
    )
    submitted = await db.scalar(
        select(func.count())
        .select_from(StudentExamAttempt)
        .where(
            StudentExamAttempt.exam_session_id == session.id,
            StudentExamAttempt.submitted_at.isnot(None),
        )
    )
    if enrolled and submitted == enrolled and session.status == ExamStatus.ACTIVE:
        now = datetime.now(timezone.utc)
        session.status = ExamStatus.CLOSED
        session.closed_at = now
        session.results_published = True


async def finalize_exam_submission(
    attempt: StudentExamAttempt,
    session: ExamSession,
    exam: Exam,
    answer_items: list[SubmitAnswerItem],
    db: AsyncSession,
) -> StudentExamAttempt:
    now = datetime.now(timezone.utc)
    questions = await _questions_by_id(exam.id, db)
    for old in (await db.execute(select(Answer).where(Answer.attempt_id == attempt.id))).scalars():
        await db.delete(old)
    selected_by_q = {
        item.question_id: item.selected_option_ids
        for item in answer_items
        if item.question_id in questions
    }
    items_by_q = {item.question_id: item for item in answer_items if item.question_id in questions}
    total, max_total, normalized = score_exam_answers(questions, selected_by_q)
    for qid, selected in normalized.items():
        item = items_by_q.get(qid) or SubmitAnswerItem(question_id=qid, selected_option_ids=selected)
        fields = persist_fields_for_answer(item, questions[qid])
        db.add(
            Answer(
                attempt_id=attempt.id,
                question_id=qid,
                **fields,
            )
        )
    attempt.submitted_at = now
    attempt.score = total
    attempt.max_score = max_total
    attempt.can_resubmit = is_tirgoul(exam)
    await db.flush()
    await _close_session_if_all_done(session, exam, db)
    return attempt


async def auto_submit_if_expired(
    attempt: StudentExamAttempt,
    session: ExamSession,
    exam: Exam,
    db: AsyncSession,
) -> StudentExamAttempt:
    if attempt.submitted_at or not attempt.started_at or not attempt.expires_at:
        return attempt
    now = datetime.now(timezone.utc)
    if now <= as_utc(attempt.expires_at):
        return attempt
    if not exam.auto_submit_on_timeout:
        raise HTTPException(status_code=400, detail="הזמן נגמר")
    items = await draft_answer_items(attempt.id, exam.id, db)
    return await finalize_exam_submission(attempt, session, exam, items, db)
