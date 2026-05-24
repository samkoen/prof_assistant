from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ExamStatus, QuestionType
from app.models.exam import ExamSession, Question, QuestionOption
from app.schemas.exam import QuestionCreate


async def exam_has_active_sessions(exam_id: int, db: AsyncSession) -> bool:
    count = await db.scalar(
        select(func.count())
        .select_from(ExamSession)
        .where(ExamSession.exam_id == exam_id, ExamSession.status != ExamStatus.DRAFT)
    )
    return (count or 0) > 0


async def next_question_order_index(exam_id: int, db: AsyncSession) -> int:
    max_idx = await db.scalar(
        select(func.max(Question.order_index)).where(Question.exam_id == exam_id)
    )
    return (max_idx or -1) + 1


def validate_question_body(body: QuestionCreate, index: int) -> None:
    from fastapi import HTTPException

    label = f"שאלה {index + 1}"
    if not body.text.strip():
        raise HTTPException(status_code=400, detail=f"{label}: טקסט חסר")
    if body.question_type == QuestionType.TRUE_FALSE:
        if len(body.options) != 2:
            raise HTTPException(status_code=400, detail=f"{label}: נדרשות 2 אפשרויות (נכון/לא נכון)")
    elif len(body.options) < 2:
        raise HTTPException(status_code=400, detail=f"{label}: לפחות 2 אפשרויות")
    correct = [o for o in body.options if o.is_correct]
    if body.question_type == QuestionType.SINGLE and len(correct) != 1:
        raise HTTPException(status_code=400, detail=f"{label}: נדרשת תשובה נכונה אחת")
    if body.question_type == QuestionType.MULTIPLE and len(correct) < 1:
        raise HTTPException(status_code=400, detail=f"{label}: לפחות תשובה נכונה אחת")
    if body.question_type == QuestionType.TRUE_FALSE and len(correct) != 1:
        raise HTTPException(status_code=400, detail=f"{label}: נדרשת תשובה נכונה אחת")


async def persist_question(
    exam_id: int,
    body: QuestionCreate,
    order_index: int,
    db: AsyncSession,
) -> Question:
    question = Question(
        exam_id=exam_id,
        text=body.text.strip(),
        question_type=body.question_type,
        order_index=order_index,
        points=body.points,
        multiple_scoring_mode=body.multiple_scoring_mode,
    )
    db.add(question)
    await db.flush()
    for opt in body.options:
        db.add(
            QuestionOption(
                question_id=question.id,
                text=opt.text.strip(),
                is_correct=opt.is_correct,
                order_index=opt.order_index,
            )
        )
    return question
