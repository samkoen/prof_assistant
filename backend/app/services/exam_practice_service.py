"""Révision post-mבחן — réponses temporaires et note de pratique."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.exam import Exam, ExamPracticeResult, ExamSession, OpenAnswerEvaluation, PracticeAnswer, Question, QuestionAiExplanation, StudentExamAttempt
from app.schemas.exam import SubmitAnswerItem
from app.services.exam_submit_service import persist_fields_for_answer
from app.services.scoring import score_exam_answers


async def _questions_by_id(exam_id: int, db: AsyncSession) -> dict[int, Question]:
    result = await db.execute(
        select(Question).options(selectinload(Question.options)).where(Question.exam_id == exam_id)
    )
    return {q.id: q for q in result.scalars().all()}


async def _delete_practice_rows(model, attempt_id: int, db: AsyncSession) -> None:
    for row in (
        await db.execute(
            select(model).where(model.attempt_id == attempt_id, model.for_practice.is_(True))
        )
    ).scalars():
        await db.delete(row)


async def clear_practice_data(attempt_id: int, db: AsyncSession) -> None:
    await db.execute(delete(PracticeAnswer).where(PracticeAnswer.attempt_id == attempt_id))
    await _delete_practice_rows(QuestionAiExplanation, attempt_id, db)
    await _delete_practice_rows(OpenAnswerEvaluation, attempt_id, db)


async def get_submitted_attempt(
    session_id: int, student_id: int, db: AsyncSession
) -> StudentExamAttempt:
    row = await db.execute(
        select(StudentExamAttempt).where(
            StudentExamAttempt.exam_session_id == session_id,
            StudentExamAttempt.student_id == student_id,
        )
    )
    attempt = row.scalar_one_or_none()
    if not attempt or not attempt.submitted_at:
        raise HTTPException(status_code=400, detail="יש להגיש את המבחן לפני תרגול")
    return attempt


async def start_practice(attempt: StudentExamAttempt, db: AsyncSession) -> StudentExamAttempt:
    await clear_practice_data(attempt.id, db)
    attempt.practice_active = True
    await db.flush()
    return attempt


async def save_practice_answers(
    attempt: StudentExamAttempt,
    exam: Exam,
    answer_items: list[SubmitAnswerItem],
    db: AsyncSession,
) -> None:
    if not attempt.practice_active:
        raise HTTPException(status_code=400, detail="אין תרגול פעיל")
    questions = await _questions_by_id(exam.id, db)
    existing = (
        await db.execute(select(PracticeAnswer).where(PracticeAnswer.attempt_id == attempt.id))
    ).scalars()
    by_q = {a.question_id: a for a in existing}
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
                PracticeAnswer(
                    attempt_id=attempt.id,
                    question_id=item.question_id,
                    **fields,
                )
            )
    await db.flush()


async def finalize_practice_submission(
    attempt: StudentExamAttempt,
    exam: Exam,
    answer_items: list[SubmitAnswerItem],
    db: AsyncSession,
) -> StudentExamAttempt:
    if not attempt.practice_active:
        raise HTTPException(status_code=400, detail="אין תרגול פעיל")
    now = datetime.now(timezone.utc)
    questions = await _questions_by_id(exam.id, db)
    await clear_practice_data(attempt.id, db)
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
            PracticeAnswer(
                attempt_id=attempt.id,
                question_id=qid,
                **fields,
            )
        )
    attempt.practice_active = False
    attempt.practice_score = total
    attempt.practice_max_score = max_total
    attempt.practice_submitted_at = now
    db.add(
        ExamPracticeResult(
            attempt_id=attempt.id,
            score=total,
            max_score=max_total,
            submitted_at=now,
        )
    )
    await db.flush()
    return attempt


async def list_practice_results(
    attempt_id: int, db: AsyncSession
) -> list[ExamPracticeResult]:
    rows = await db.execute(
        select(ExamPracticeResult)
        .where(ExamPracticeResult.attempt_id == attempt_id)
        .order_by(ExamPracticeResult.submitted_at.desc(), ExamPracticeResult.id.desc())
    )
    return list(rows.scalars().all())


async def practice_answers_map(attempt_id: int, db: AsyncSession) -> dict[int, list[int]]:
    selected, _texts = await practice_answer_maps(attempt_id, db)
    return selected


async def practice_answer_maps(
    attempt_id: int, db: AsyncSession
) -> tuple[dict[int, list[int]], dict[int, str]]:
    from app.services.open_answer_evaluation import maps_from_answer_rows

    rows = (
        await db.execute(select(PracticeAnswer).where(PracticeAnswer.attempt_id == attempt_id))
    ).scalars()
    return maps_from_answer_rows(rows)
