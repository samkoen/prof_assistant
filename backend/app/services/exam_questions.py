from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import ExamStatus, QuestionType
from app.models.exam import ExamSession, Question, QuestionOption
from app.schemas.exam import QuestionCreate, QuestionUpdate


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


async def delete_question(exam_id: int, question_id: int, db: AsyncSession) -> None:
    result = await db.execute(
        select(Question).where(Question.id == question_id, Question.exam_id == exam_id)
    )
    question = result.scalar_one_or_none()
    if not question:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="שאלה לא נמצאה")
    for opt in (
        await db.execute(select(QuestionOption).where(QuestionOption.question_id == question_id))
    ).scalars():
        await db.delete(opt)
    await db.delete(question)


async def update_question(
    exam_id: int,
    question_id: int,
    body: QuestionUpdate,
    db: AsyncSession,
) -> Question:
    from fastapi import HTTPException

    result = await db.execute(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.id == question_id, Question.exam_id == exam_id)
    )
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="שאלה לא נמצאה")

    create_body = QuestionCreate(
        text=body.text,
        question_type=body.question_type,
        order_index=question.order_index,
        points=body.points,
        multiple_scoring_mode=body.multiple_scoring_mode,
        options=body.options,
    )
    validate_question_body(create_body, 0)

    question.text = body.text.strip()
    question.question_type = body.question_type
    question.points = body.points
    question.multiple_scoring_mode = body.multiple_scoring_mode

    for opt in list(question.options):
        await db.delete(opt)
    await db.flush()

    for i, opt in enumerate(body.options):
        db.add(
            QuestionOption(
                question_id=question.id,
                text=opt.text.strip(),
                is_correct=opt.is_correct,
                order_index=opt.order_index if opt.order_index else i,
            )
        )
    return question


async def reorder_questions(exam_id: int, question_ids: list[int], db: AsyncSession) -> None:
    from fastapi import HTTPException

    result = await db.execute(select(Question).where(Question.exam_id == exam_id))
    questions = {q.id: q for q in result.scalars().all()}
    if not questions:
        raise HTTPException(status_code=400, detail="אין שאלות במבחן")
    if set(question_ids) != set(questions.keys()) or len(question_ids) != len(questions):
        raise HTTPException(status_code=400, detail="רשימת השאלות אינה תואמת")
    for index, qid in enumerate(question_ids):
        questions[qid].order_index = index
