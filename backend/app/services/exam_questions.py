from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import ExamStatus, ModelAnswerSource, QuestionType
from app.models.exam import ExamSession, Question, QuestionOption, StudentExamAttempt
from app.schemas.exam import QuestionCreate, QuestionUpdate

_TRIM_EDGES = "\n\r\t"


def normalize_question_text(text: str) -> str:
    """Supprime sauts de ligne / tabulations en tête/fin — conserve les espaces (schémas ASCII)."""
    return text.strip(_TRIM_EDGES)


async def exam_has_active_sessions(exam_id: int, db: AsyncSession) -> bool:
    """Vrai si session active ou fermée avec au moins une tentative en cours."""
    active = await db.scalar(
        select(func.count())
        .select_from(ExamSession)
        .where(ExamSession.exam_id == exam_id, ExamSession.status == ExamStatus.ACTIVE)
    )
    if active:
        return True
    in_progress = await db.scalar(
        select(func.count())
        .select_from(StudentExamAttempt)
        .join(ExamSession, StudentExamAttempt.exam_session_id == ExamSession.id)
        .where(
            ExamSession.exam_id == exam_id,
            ExamSession.status == ExamStatus.CLOSED,
            StudentExamAttempt.started_at.isnot(None),
            StudentExamAttempt.submitted_at.is_(None),
        )
    )
    return (in_progress or 0) > 0


async def next_question_order_index(exam_id: int, db: AsyncSession) -> int:
    max_idx = await db.scalar(
        select(func.max(Question.order_index)).where(Question.exam_id == exam_id)
    )
    return (max_idx or -1) + 1


def _has_content(text: str, image_url: str | None) -> bool:
    return bool(text.strip()) or bool((image_url or "").strip())


def _normalized_model_answer(text: str | None) -> str | None:
    cleaned = normalize_question_text(text or "")
    return cleaned or None


def _model_answer_source(
    text: str | None,
    requested: ModelAnswerSource | None,
    previous_text: str | None = None,
    previous_source: ModelAnswerSource | None = None,
) -> ModelAnswerSource | None:
    if not text:
        return None
    if requested:
        return requested
    if previous_text == text:
        return previous_source or ModelAnswerSource.TEACHER
    return ModelAnswerSource.TEACHER


def _validate_qcm_options(body: QuestionCreate, label: str) -> None:
    from fastapi import HTTPException

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
    for opt_idx, opt in enumerate(body.options):
        if not _has_content(opt.text, opt.image_url):
            raise HTTPException(
                status_code=400,
                detail=f"{label}, אפשרות {opt_idx + 1}: נדרש טקסט או תמונה",
            )


def validate_question_body(body: QuestionCreate, index: int) -> None:
    from fastapi import HTTPException

    label = f"שאלה {index + 1}"
    if not _has_content(body.text, body.image_url):
        raise HTTPException(status_code=400, detail=f"{label}: נדרש טקסט או תמונה")
    if body.question_type == QuestionType.OPEN:
        return
    _validate_qcm_options(body, label)


async def persist_question(
    exam_id: int,
    body: QuestionCreate,
    order_index: int,
    db: AsyncSession,
) -> Question:
    question = Question(
        exam_id=exam_id,
        text=normalize_question_text(body.text),
        image_url=(body.image_url or None),
        question_type=body.question_type,
        order_index=order_index,
        points=body.points,
        multiple_scoring_mode=body.multiple_scoring_mode,
        model_answer=_normalized_model_answer(body.model_answer),
        model_answer_source=_model_answer_source(
            _normalized_model_answer(body.model_answer), body.model_answer_source
        ),
    )
    db.add(question)
    await db.flush()
    if body.question_type == QuestionType.OPEN:
        return question
    for opt in body.options:
        db.add(
            QuestionOption(
                question_id=question.id,
                text=normalize_question_text(opt.text),
                image_url=(opt.image_url or None),
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
        image_url=body.image_url,
        question_type=body.question_type,
        order_index=question.order_index,
        points=body.points,
        multiple_scoring_mode=body.multiple_scoring_mode,
        model_answer=body.model_answer,
        model_answer_source=body.model_answer_source,
        options=body.options,
    )
    validate_question_body(create_body, 0)
    model_text = _normalized_model_answer(body.model_answer)
    question.text = normalize_question_text(body.text)
    question.image_url = body.image_url or None
    question.question_type = body.question_type
    question.points = body.points
    question.multiple_scoring_mode = body.multiple_scoring_mode
    question.model_answer_source = _model_answer_source(
        model_text, body.model_answer_source, question.model_answer, question.model_answer_source
    )
    question.model_answer = model_text

    for opt in list(question.options):
        await db.delete(opt)
    await db.flush()
    if body.question_type == QuestionType.OPEN:
        return question
    for i, opt in enumerate(body.options):
        db.add(
            QuestionOption(
                question_id=question.id,
                text=normalize_question_text(opt.text),
                image_url=(opt.image_url or None),
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
