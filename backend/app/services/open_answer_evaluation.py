"""Évaluation IA des questions ouvertes : bonne réponse partagée, appréciation par élève."""

from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course import CourseEnrollment
from app.models.enums import EnrollmentStatus, ModelAnswerSource, QuestionType
from app.models.exam import (
    Answer,
    ExamPracticeResult,
    ExamSession,
    OpenAnswerEvaluation,
    PracticeAnswer,
    Question,
    StudentExamAttempt,
)
from app.models.user import User
from app.schemas.gemini_questions import GeminiSeriesLanguage
from app.services.ai_client import AiError, generate_text
from app.services.open_answer_parse import parse_open_evaluation_json
from app.services.open_answer_prompt import (
    build_evaluation_prompt,
    build_model_answer_prompt,
    evaluation_system_prompt,
    model_answer_system_prompt,
)
from app.services.open_answer_text import looks_latin_transliteration, sanitize_eval_text
from app.services.scoring import clamp_open_score, score_exam_answers


def _resolve_language(user: User) -> GeminiSeriesLanguage:
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


async def load_evaluations_map(
    attempt_id: int,
    db: AsyncSession,
    *,
    for_practice: bool,
) -> dict[int, OpenAnswerEvaluation]:
    rows = await db.execute(
        select(OpenAnswerEvaluation).where(
            OpenAnswerEvaluation.attempt_id == attempt_id,
            OpenAnswerEvaluation.for_practice.is_(for_practice),
        )
    )
    return {row.question_id: row for row in rows.scalars().all()}


def maps_from_answer_rows(rows) -> tuple[dict[int, list[int]], dict[int, str]]:
    selected: dict[int, list[int]] = {}
    texts: dict[int, str] = {}
    for row in rows:
        selected[row.question_id] = list(row.selected_option_ids or [])
        if row.text_answer:
            texts[row.question_id] = row.text_answer
    return selected, texts


async def _questions_by_id(exam_id: int, db: AsyncSession) -> dict[int, Question]:
    result = await db.execute(
        select(Question).options(selectinload(Question.options)).where(Question.exam_id == exam_id)
    )
    return {q.id: q for q in result.scalars().all()}


async def _load_answer_rows(attempt_id: int, db: AsyncSession, *, for_practice: bool):
    model = PracticeAnswer if for_practice else Answer
    result = await db.execute(select(model).where(model.attempt_id == attempt_id))
    return list(result.scalars().all())


async def recalculate_attempt_score(
    attempt: StudentExamAttempt,
    exam_id: int,
    db: AsyncSession,
    *,
    for_practice: bool,
) -> tuple[float, float]:
    questions = await _questions_by_id(exam_id, db)
    rows = await _load_answer_rows(attempt.id, db, for_practice=for_practice)
    selected_by_q, _texts = maps_from_answer_rows(rows)
    evals = await load_evaluations_map(attempt.id, db, for_practice=for_practice)
    open_earned = {qid: ev.suggested_score for qid, ev in evals.items()}
    total, max_total, _ = score_exam_answers(questions, selected_by_q, open_earned)
    if for_practice:
        attempt.practice_score = total
        attempt.practice_max_score = max_total
        await _sync_latest_practice_result(attempt.id, total, max_total, db)
    else:
        attempt.score = total
        attempt.max_score = max_total
    return total, max_total


async def _sync_latest_practice_result(
    attempt_id: int, score: float, max_score: float, db: AsyncSession
) -> None:
    row = await db.execute(
        select(ExamPracticeResult)
        .where(ExamPracticeResult.attempt_id == attempt_id)
        .order_by(ExamPracticeResult.submitted_at.desc(), ExamPracticeResult.id.desc())
        .limit(1)
    )
    latest = row.scalar_one_or_none()
    if latest:
        latest.score = score
        latest.max_score = max_score


async def generate_model_answer_text(
    question_text: str, language: GeminiSeriesLanguage
) -> str:
    prompt = build_model_answer_prompt(question_text, language)
    system = model_answer_system_prompt(language)
    try:
        text = (await generate_text(prompt, system=system)).strip()
    except AiError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    cleaned = sanitize_eval_text(text, language) or text
    if not cleaned:
        raise HTTPException(status_code=502, detail="ה-AI החזיר תשובה ריקה")
    return cleaned


async def _load_session_for_student(session_id: int, user: User, db: AsyncSession) -> ExamSession:
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
    return session


def _assert_review_allowed(session: ExamSession, *, for_practice: bool) -> None:
    exam = session.exam
    if not exam.show_detailed_correction:
        raise HTTPException(status_code=403, detail="הסבר אינו זמין למבחן זה")
    if not for_practice and not session.results_published:
        raise HTTPException(status_code=403, detail="התוצאות טרם פורסמו")


async def _load_submitted_attempt(
    session: ExamSession, user: User, db: AsyncSession, *, for_practice: bool
) -> StudentExamAttempt:
    attempt_row = await db.execute(
        select(StudentExamAttempt).where(
            StudentExamAttempt.exam_session_id == session.id,
            StudentExamAttempt.student_id == user.id,
        )
    )
    attempt = attempt_row.scalar_one_or_none()
    if not attempt or not attempt.submitted_at:
        raise HTTPException(status_code=400, detail="יש להגיש את המבחן לפני בקשת הערכה")
    if for_practice and not attempt.practice_submitted_at:
        raise HTTPException(status_code=400, detail="יש להשלים תרגול לפני בקשת הערכה")
    return attempt


async def _load_open_question(exam_id: int, question_id: int, db: AsyncSession) -> Question:
    q_row = await db.execute(
        select(Question).where(Question.id == question_id, Question.exam_id == exam_id)
    )
    question = q_row.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="שאלה לא נמצאה")
    if question.question_type != QuestionType.OPEN:
        raise HTTPException(status_code=400, detail="השאלה אינה פתוחה")
    return question


async def _student_text(
    attempt_id: int, question_id: int, db: AsyncSession, *, for_practice: bool
) -> str:
    model = PracticeAnswer if for_practice else Answer
    row = await db.execute(
        select(model).where(model.attempt_id == attempt_id, model.question_id == question_id)
    )
    answer = row.scalar_one_or_none()
    return (answer.text_answer or "").strip() if answer else ""


async def _load_cached_eval(
    attempt_id: int, question_id: int, db: AsyncSession, *, for_practice: bool
) -> OpenAnswerEvaluation | None:
    row = await db.execute(
        select(OpenAnswerEvaluation).where(
            OpenAnswerEvaluation.attempt_id == attempt_id,
            OpenAnswerEvaluation.question_id == question_id,
            OpenAnswerEvaluation.for_practice.is_(for_practice),
        )
    )
    return row.scalar_one_or_none()


def _maybe_store_model_answer(question: Question, generated: str | None) -> None:
    if question.model_answer and question.model_answer.strip():
        return
    text = (generated or "").strip()
    if not text:
        return
    question.model_answer = text
    question.model_answer_source = ModelAnswerSource.AI


async def _upsert_evaluation(
    attempt_id: int,
    question_id: int,
    language: GeminiSeriesLanguage,
    appreciation: str,
    score: float,
    db: AsyncSession,
    *,
    for_practice: bool,
) -> OpenAnswerEvaluation:
    cached = await _load_cached_eval(attempt_id, question_id, db, for_practice=for_practice)
    if cached:
        cached.appreciation = appreciation
        cached.suggested_score = score
        cached.language = language
        return cached
    row = OpenAnswerEvaluation(
        attempt_id=attempt_id,
        question_id=question_id,
        for_practice=for_practice,
        language=language,
        appreciation=appreciation,
        suggested_score=score,
    )
    db.add(row)
    return row


async def _eval_once(
    question: Question,
    student_text: str,
    language: GeminiSeriesLanguage,
    *,
    strict: bool = False,
):
    prompt = build_evaluation_prompt(
        question.text,
        student_text,
        question.points,
        language,
        model_answer=question.model_answer,
        strict=strict,
    )
    system = evaluation_system_prompt(language, strict=strict)
    raw = await generate_text(prompt, system=system)
    parsed = parse_open_evaluation_json(raw)
    appreciation = sanitize_eval_text(parsed.appreciation, language) or parsed.appreciation
    model = sanitize_eval_text(parsed.model_answer, language)
    score = clamp_open_score(parsed.score, question.points)
    return appreciation, score, model


async def _run_ai_evaluation(
    question: Question, student_text: str, language: GeminiSeriesLanguage
):
    appreciation, score, model = await _eval_once(question, student_text, language)
    if language == "he" and looks_latin_transliteration(appreciation):
        try:
            return await _eval_once(question, student_text, language, strict=True)
        except (ValueError, AiError):
            return appreciation, score, model
    return appreciation, score, model


async def evaluate_open_answer(
    session_id: int,
    question_id: int,
    user: User,
    db: AsyncSession,
    *,
    for_practice: bool = False,
    regenerate: bool = False,
):
    language = _resolve_language(user)
    session = await _load_session_for_student(session_id, user, db)
    _assert_review_allowed(session, for_practice=for_practice)
    attempt = await _load_submitted_attempt(session, user, db, for_practice=for_practice)
    question = await _load_open_question(session.exam.id, question_id, db)
    cached = await _load_cached_eval(attempt.id, question_id, db, for_practice=for_practice)
    if cached and not regenerate:
        return _to_eval_response(cached, question, attempt, from_cache=True, for_practice=for_practice)
    return await _generate_and_store(
        attempt, question, db, language=language, for_practice=for_practice
    )


def _attempt_totals(attempt: StudentExamAttempt, *, for_practice: bool) -> tuple[float | None, float | None]:
    if for_practice:
        return attempt.practice_score, attempt.practice_max_score
    return attempt.score, attempt.max_score


def _to_eval_response(row, question: Question, attempt: StudentExamAttempt, *, from_cache: bool, for_practice: bool):
    from app.schemas.open_answer import OpenEvaluationResponse

    score, max_score = _attempt_totals(attempt, for_practice=for_practice)
    return OpenEvaluationResponse(
        question_id=question.id,
        appreciation=row.appreciation,
        suggested_score=row.suggested_score,
        model_answer=question.model_answer,
        from_cache=from_cache,
        attempt_score=score,
        attempt_max_score=max_score,
    )


async def _generate_and_store(
    attempt: StudentExamAttempt,
    question: Question,
    db: AsyncSession,
    *,
    language: GeminiSeriesLanguage,
    for_practice: bool,
):
    student_text = await _student_text(attempt.id, question.id, db, for_practice=for_practice)
    try:
        appreciation, score, generated_model = await _run_ai_evaluation(
            question, student_text, language
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="ה-AI החזיר פורמט לא תקין") from exc
    except AiError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    _maybe_store_model_answer(question, generated_model)
    row = await _upsert_evaluation(
        attempt.id, question.id, language, appreciation, score, db, for_practice=for_practice
    )
    await recalculate_attempt_score(attempt, question.exam_id, db, for_practice=for_practice)
    await db.commit()
    return _to_eval_response(row, question, attempt, from_cache=False, for_practice=for_practice)




