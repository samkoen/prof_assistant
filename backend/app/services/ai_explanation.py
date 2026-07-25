from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course import CourseEnrollment
from app.models.enums import EnrollmentStatus
from app.models.exam import Answer, ExamSession, PracticeAnswer, Question, QuestionAiExplanation, StudentExamAttempt
from app.models.user import User
from app.schemas.gemini_questions import GeminiSeriesLanguage
from app.services.ai_explanation_prompt import (
    ExplanationLanguage,
    build_explanation_prompt,
    explanation_system_prompt,
)
from app.services.ai_client import AiError, generate_text


def _resolve_language(user: User) -> ExplanationLanguage:
    lang = user.ai_explanation_language or "he"
    if lang in ("he", "fr", "en", "ru"):
        return lang  # type: ignore[return-value]
    return "he"


async def _student_approved(offering_id: int, user: User, db: AsyncSession) -> bool:
    row = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.offering_id == offering_id,
            CourseEnrollment.student_id == user.id,
            CourseEnrollment.status == EnrollmentStatus.APPROVED,
        )
    )
    return row.scalar_one_or_none() is not None


async def _load_review_context(
    session_id: int,
    question_id: int,
    user: User,
    db: AsyncSession,
    *,
    for_practice: bool = False,
) -> tuple[int, Question, list[int]]:
    session_row = await db.execute(
        select(ExamSession)
        .options(selectinload(ExamSession.exam))
        .where(ExamSession.id == session_id)
    )
    session = session_row.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="מבחן לא נמצא")
    if not await _student_approved(session.offering_id, user, db):
        raise HTTPException(status_code=403, detail="אין גישה")

    exam = session.exam
    if not exam.show_detailed_correction:
        raise HTTPException(status_code=403, detail="הסבר אינו זמין למבחן זה")
    if not for_practice and not session.results_published:
        raise HTTPException(status_code=403, detail="התוצאות טרם פורסמו")

    attempt_row = await db.execute(
        select(StudentExamAttempt).where(
            StudentExamAttempt.exam_session_id == session.id,
            StudentExamAttempt.student_id == user.id,
        )
    )
    attempt = attempt_row.scalar_one_or_none()
    if not attempt or not attempt.submitted_at:
        raise HTTPException(status_code=400, detail="יש להגיש את המבחן לפני בקשת הסבר")
    if for_practice and not attempt.practice_submitted_at:
        raise HTTPException(status_code=400, detail="יש להשלים תרגול לפני בקשת הסבר")

    q_row = await db.execute(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.id == question_id, Question.exam_id == exam.id)
    )
    question = q_row.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="שאלה לא נמצאה")

    if for_practice:
        ans_row = await db.execute(
            select(PracticeAnswer).where(
                PracticeAnswer.attempt_id == attempt.id,
                PracticeAnswer.question_id == question.id,
            )
        )
    else:
        ans_row = await db.execute(
            select(Answer).where(Answer.attempt_id == attempt.id, Answer.question_id == question.id)
        )
    answer = ans_row.scalar_one_or_none()
    selected = list(answer.selected_option_ids) if answer else []
    return attempt.id, question, selected


async def _load_cached(
    attempt_id: int,
    question_id: int,
    language: GeminiSeriesLanguage,
    db: AsyncSession,
    *,
    for_practice: bool = False,
) -> QuestionAiExplanation | None:
    row = await db.execute(
        select(QuestionAiExplanation).where(
            QuestionAiExplanation.attempt_id == attempt_id,
            QuestionAiExplanation.question_id == question_id,
            QuestionAiExplanation.language == language,
            QuestionAiExplanation.for_practice == for_practice,
        )
    )
    return row.scalar_one_or_none()


async def _upsert_cache(
    attempt_id: int,
    question_id: int,
    language: GeminiSeriesLanguage,
    explanation: str,
    db: AsyncSession,
    *,
    for_practice: bool = False,
) -> None:
    cached = await _load_cached(
        attempt_id, question_id, language, db, for_practice=for_practice
    )
    if cached:
        cached.explanation = explanation
    else:
        db.add(
            QuestionAiExplanation(
                attempt_id=attempt_id,
                question_id=question_id,
                language=language,
                explanation=explanation,
                for_practice=for_practice,
            )
        )
    await db.commit()


async def _generate_explanation(
    question: Question,
    selected: list[int],
    language: ExplanationLanguage,
) -> str:
    prompt = build_explanation_prompt(question, selected, language)
    system = explanation_system_prompt(language)
    return await generate_text(prompt, system=system)


async def explain_exam_question(
    session_id: int,
    question_id: int,
    user: User,
    db: AsyncSession,
    *,
    for_practice: bool = False,
) -> tuple[str, bool]:
    language = _resolve_language(user)
    attempt_id, question, selected = await _load_review_context(
        session_id, question_id, user, db, for_practice=for_practice
    )
    cached = await _load_cached(
        attempt_id, question_id, language, db, for_practice=for_practice
    )
    if cached:
        return cached.explanation, True
    try:
        explanation = await _generate_explanation(question, selected, language)
        await _upsert_cache(
            attempt_id, question_id, language, explanation, db, for_practice=for_practice
        )
        return explanation, False
    except AiError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


async def regenerate_exam_question_explanation(
    session_id: int,
    question_id: int,
    user: User,
    db: AsyncSession,
    *,
    for_practice: bool = False,
) -> str:
    language = _resolve_language(user)
    attempt_id, question, selected = await _load_review_context(
        session_id, question_id, user, db, for_practice=for_practice
    )
    try:
        explanation = await _generate_explanation(question, selected, language)
        await _upsert_cache(
            attempt_id, question_id, language, explanation, db, for_practice=for_practice
        )
        return explanation
    except AiError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
