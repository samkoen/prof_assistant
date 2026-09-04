from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.exam import ExamSession, Question, QuestionAiExplanation, StudentExamAttempt
from app.schemas.exam import AnswerKeyQuestionPatch, AnswerKeyUpdateResponse
from app.services.exam_answer_key import apply_option_correct_flags, validate_question_key
from app.services.open_answer_evaluation import recalculate_attempt_score


async def _questions_for_exam(exam_id: int, db: AsyncSession) -> dict[int, Question]:
    result = await db.execute(
        select(Question).options(selectinload(Question.options)).where(Question.exam_id == exam_id)
    )
    return {q.id: q for q in result.scalars().all()}


def _apply_one_question_key(question: Question, correct_ids: set[int]) -> bool:
    option_ids = {o.id for o in question.options}
    error = validate_question_key(question.question_type, option_ids, correct_ids)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return apply_option_correct_flags(question.options, correct_ids)


async def _patch_question_keys(
    questions: dict[int, Question],
    items: list[AnswerKeyQuestionPatch],
) -> list[int]:
    changed: list[int] = []
    for item in items:
        question = questions.get(item.question_id)
        if not question:
            raise HTTPException(status_code=404, detail="שאלה לא נמצאה")
        if _apply_one_question_key(question, set(item.correct_option_ids)):
            changed.append(question.id)
    return changed


async def _submitted_attempts(exam_id: int, db: AsyncSession) -> list[StudentExamAttempt]:
    result = await db.execute(
        select(StudentExamAttempt)
        .join(ExamSession)
        .where(
            ExamSession.exam_id == exam_id,
            StudentExamAttempt.submitted_at.isnot(None),
        )
    )
    return list(result.scalars().all())


async def _regrade_submitted(exam_id: int, db: AsyncSession) -> int:
    attempts = await _submitted_attempts(exam_id, db)
    for attempt in attempts:
        await recalculate_attempt_score(attempt, exam_id, db, for_practice=False)
    return len(attempts)


async def _drop_explanations(question_ids: list[int], db: AsyncSession) -> None:
    if not question_ids:
        return
    await db.execute(
        delete(QuestionAiExplanation).where(QuestionAiExplanation.question_id.in_(question_ids))
    )


async def apply_answer_key_and_regrade(
    exam_id: int,
    items: list[AnswerKeyQuestionPatch],
    db: AsyncSession,
) -> AnswerKeyUpdateResponse:
    questions = await _questions_for_exam(exam_id, db)
    changed_ids = await _patch_question_keys(questions, items)
    if not changed_ids:
        return AnswerKeyUpdateResponse(questions_updated=0, regraded_attempts=0)
    await db.flush()
    regraded = await _regrade_submitted(exam_id, db)
    await _drop_explanations(changed_ids, db)
    return AnswerKeyUpdateResponse(questions_updated=len(changed_ids), regraded_attempts=regraded)
