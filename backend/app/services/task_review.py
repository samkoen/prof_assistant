"""Soumission, vérification IA et correction professeur d'une משימה."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import TaskReviewSource
from app.models.exam import Exam, ExamSession, StudentExamAttempt
from app.models.task import TaskReview, TaskStep
from app.models.user import User
from app.schemas.task import TaskReviewOut, TaskReviewPatch
from app.services.ai_attachments import AiAttachment
from app.services.ai_client import generate_text
from app.services.billing.constants import TEACHER_GENERATION
from app.services.billing.context import bill_ai
from app.services.task_parse import ParsedTaskVerification, parse_task_verification
from app.services.task_prompt import task_system_prompt, task_user_prompt
from app.services.task_proofs import load_proof_bytes, proofs_by_step
from app.services.task_rules import StepPoints, attempt_totals, auto_not_done, clamp_task_score, is_known_verdict
from app.services.task_service import list_steps


def _language(user: User) -> str:
    lang = user.ai_explanation_language or "he"
    return lang if lang in ("he", "fr", "en", "ru") else "he"


async def _reviews_by_step(attempt_id: int, db: AsyncSession) -> dict[int, TaskReview]:
    rows = await db.execute(select(TaskReview).where(TaskReview.attempt_id == attempt_id))
    return {row.step_id: row for row in rows.scalars().all()}


async def refresh_attempt_score(attempt: StudentExamAttempt, exam_id: int, db: AsyncSession) -> None:
    session = await db.get(ExamSession, attempt.exam_session_id)
    if session and session.grading_locked:
        return
    steps = await list_steps(exam_id, db)
    reviews = await _reviews_by_step(attempt.id, db)
    scores = {step_id: row.score for step_id, row in reviews.items()}
    points = [StepPoints(step.id, step.max_points) for step in steps]
    earned, maximum = attempt_totals(points, scores)
    attempt.score = earned
    attempt.max_score = maximum


async def finalize_task_submission(attempt: StudentExamAttempt, exam: Exam, db: AsyncSession) -> None:
    """Sans fichier : pas fait, 0 point, sans IA. Avec fichier : en attente."""
    steps = await list_steps(exam.id, db)
    proofs = await proofs_by_step(attempt.id, db)
    reviews = await _reviews_by_step(attempt.id, db)
    for step in steps:
        if step.id in proofs or step.id in reviews:
            continue
        verdict, score, source = auto_not_done()
        _add_review(attempt.id, step.id, verdict, score, None, source, None, db)
    attempt.submitted_at = datetime.now(timezone.utc)
    attempt.can_resubmit = False
    await db.flush()
    await refresh_attempt_score(attempt, exam.id, db)


def _add_review(attempt_id, step_id, verdict, score, ai_score, source, appreciation, db) -> None:
    db.add(
        TaskReview(
            attempt_id=attempt_id,
            step_id=step_id,
            verdict=verdict,
            score=score,
            ai_score=ai_score,
            source=source,
            appreciation=appreciation,
        )
    )


async def _call_model(user: User, step: TaskStep, filename: str, mime: str, data: bytes) -> ParsedTaskVerification:
    language = _language(user)
    attachment = AiAttachment(filename=filename, mime_type=mime, data=data)
    async with bill_ai(user, TEACHER_GENERATION):
        raw = await generate_text(
            task_user_prompt(step.title, step.instructions, step.max_points, language),
            system=task_system_prompt(language),
            attachments=[attachment],
        )
    parsed = parse_task_verification(raw)
    score = clamp_task_score(parsed.score, step.max_points)
    return ParsedTaskVerification(parsed.verdict, score, parsed.appreciation)


async def verify_step(user: User, attempt: StudentExamAttempt, exam: Exam, step_id: int, db: AsyncSession) -> TaskReview:
    if not attempt.submitted_at:
        raise HTTPException(status_code=400, detail="המשימה טרם הוגשה")
    step = await _owned_step(exam.id, step_id, db)
    proof = await load_proof_bytes(attempt.id, step.id, db)
    parsed = await _call_model(user, step, proof.filename, proof.mime_type, proof.file_data)
    review = await _save_ai_review(attempt.id, step, parsed, db)
    await refresh_attempt_score(attempt, exam.id, db)
    return review


async def _owned_step(exam_id: int, step_id: int, db: AsyncSession) -> TaskStep:
    from app.services.task_service import _step_of

    return await _step_of(exam_id, step_id, db)


async def _save_ai_review(attempt_id: int, step: TaskStep, parsed: ParsedTaskVerification, db: AsyncSession) -> TaskReview:
    reviews = await _reviews_by_step(attempt_id, db)
    review = reviews.get(step.id)
    if review is None:
        review = TaskReview(attempt_id=attempt_id, step_id=step.id, verdict=parsed.verdict, score=parsed.score, source=TaskReviewSource.AI)
        db.add(review)
    review.verdict = parsed.verdict
    review.score = parsed.score
    review.ai_score = parsed.score
    review.appreciation = parsed.appreciation
    review.source = TaskReviewSource.AI
    await db.flush()
    return review


async def apply_teacher_review(
    attempt: StudentExamAttempt, exam: Exam, step_id: int, body: TaskReviewPatch, db: AsyncSession
) -> TaskReview:
    if not attempt.submitted_at:
        raise HTTPException(status_code=400, detail="המשימה טרם הוגשה")
    if not is_known_verdict(body.verdict):
        raise HTTPException(status_code=400, detail="סטטוס לא תקין")
    step = await _owned_step(exam.id, step_id, db)
    review = await _upsert_teacher(attempt.id, step, body, db)
    await refresh_attempt_score(attempt, exam.id, db)
    return review


async def _upsert_teacher(attempt_id: int, step: TaskStep, body: TaskReviewPatch, db: AsyncSession) -> TaskReview:
    reviews = await _reviews_by_step(attempt_id, db)
    review = reviews.get(step.id)
    score = clamp_task_score(body.score, step.max_points)
    if review is None:
        review = TaskReview(attempt_id=attempt_id, step_id=step.id, verdict=body.verdict, score=score, source=TaskReviewSource.TEACHER)
        db.add(review)
    review.verdict = body.verdict
    review.score = score
    review.appreciation = body.appreciation.strip()
    review.source = TaskReviewSource.TEACHER
    await db.flush()
    return review


def review_rows(steps: list[TaskStep], proofs: dict, reviews: dict) -> list[TaskReviewOut]:
    return [_review_row(step, proofs.get(step.id), reviews.get(step.id)) for step in steps]


def _review_row(step: TaskStep, proof, review: TaskReview | None) -> TaskReviewOut:
    return TaskReviewOut(
        step_id=step.id,
        title=step.title,
        instructions=step.instructions,
        max_points=step.max_points,
        order_index=step.order_index,
        proof_filename=proof.filename if proof else None,
        has_proof=proof is not None,
        verdict=review.verdict if review else None,
        score=review.score if review else None,
        ai_score=review.ai_score if review else None,
        appreciation=review.appreciation if review else None,
        source=review.source if review else None,
    )


async def load_board(attempt: StudentExamAttempt, exam: Exam, db: AsyncSession) -> list[TaskReviewOut]:
    steps = await list_steps(exam.id, db)
    proofs = await proofs_by_step(attempt.id, db)
    reviews = await _reviews_by_step(attempt.id, db)
    return review_rows(steps, proofs, reviews)
