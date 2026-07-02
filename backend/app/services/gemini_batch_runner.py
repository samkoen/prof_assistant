import logging
import time
from datetime import datetime, timezone

import httpx
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from app.models.exam import Exam
from app.models.exam_gemini_generation import (
    ExamGeminiGenerationMessage,
    ExamGeminiGenerationSession,
)
from app.schemas.gemini_questions import GeminiSeriesInput
from app.services.gemini_batch_plan import (
    GeminiBatchSlice,
    build_batch_plan,
    build_chunked_batch_plan,
    completed_batches_after_accept,
    plan_from_params,
    plan_to_params,
    total_questions,
)
from app.services.gemini_batch_prompt import build_batch_generation_prompt
from app.services.gemini_qcm_batch import (
    BatchValidationResult,
    merge_accumulated_raw,
    stems_from_accumulated,
    validate_batch_raw,
)
from app.services.gemini_source_prompt import build_sources_context_block
from app.services.exam_gemini_source_service import load_sources_for_generation
from app.services.ai_client import AiError, generate_text

logger = logging.getLogger(__name__)

MAX_BATCH_RETRIES = 2


def _params(session: ExamGeminiGenerationSession) -> dict:
    return dict(session.initial_params or {})


def _save_params(session: ExamGeminiGenerationSession, params: dict) -> None:
    session.initial_params = params
    flag_modified(session, "initial_params")


def _batch_plan(params: dict) -> list[GeminiBatchSlice]:
    return plan_from_params(params.get("batch_plan") or [])


def _generated_count(plan: list[GeminiBatchSlice], completed_batches: int) -> int:
    return sum(batch.count for batch in plan[:completed_batches])


def batch_progress(params: dict) -> dict:
    plan = _batch_plan(params)
    completed = int(params.get("completed_batches") or 0)
    total = total_questions_from_plan(plan)
    return {
        "total_questions": total,
        "generated_questions": _generated_count(plan, completed),
        "completed_batches": completed,
        "total_batches": len(plan),
        "complete": completed >= len(plan) or bool(params.get("manual_refine")),
    }


def total_questions_from_plan(plan: list[GeminiBatchSlice]) -> int:
    return sum(batch.count for batch in plan)


def _is_timeout_error(exc: HTTPException) -> bool:
    msg = str(exc.detail).lower()
    return (
        "timeout" in msg
        or "timed out" in msg
        or "ארכה" in msg
        or "פסק זמן" in msg
    )


def _can_switch_to_chunked(batch: GeminiBatchSlice) -> bool:
    return batch.count > 1


def _apply_chunked_fallback(
    params: dict,
    series: list[GeminiSeriesInput],
    from_q: int,
) -> None:
    params["batch_plan"] = plan_to_params(build_chunked_batch_plan(series, from_q=from_q))
    params["chunked_fallback"] = True


async def _call_batch_model(prompt: str) -> str:
    try:
        return await generate_text(prompt, for_generation=True)
    except AiError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=503, detail="פסק זמן — היצירה ארכה יותר מדי") from exc


async def _generate_batch_raw(
    series: list[GeminiSeriesInput],
    batch: GeminiBatchSlice,
    *,
    exam_title: str | None,
    sources_block: str,
    accumulated_raw: str,
    plan: list[GeminiBatchSlice],
) -> BatchValidationResult:
    prior_stems = stems_from_accumulated(accumulated_raw)
    plan_total = total_questions_from_plan(plan)
    retry_hint: str | None = None
    last_error: HTTPException | None = None
    for attempt in range(MAX_BATCH_RETRIES + 1):
        prompt = build_batch_generation_prompt(
            series,
            batch,
            exam_title=exam_title,
            sources_block=sources_block,
            accumulated_raw=accumulated_raw,
            retry_hint=retry_hint,
        )
        raw = await _call_batch_model(prompt)
        try:
            return validate_batch_raw(
                raw,
                batch,
                prior_stems=prior_stems,
                plan_total=plan_total,
            )
        except HTTPException as exc:
            last_error = exc
            if exc.status_code != 502 or attempt >= MAX_BATCH_RETRIES:
                raise
            retry_hint = f"ניסיון חוזר ({attempt + 2}/{MAX_BATCH_RETRIES + 1}): {exc.detail}. ניסוח ודוגמאות שונים."
    assert last_error is not None
    raise last_error


async def _record_batch_exchange(
    session: ExamGeminiGenerationSession,
    prompt: str,
    raw: str,
    db: AsyncSession,
) -> None:
    db.add(ExamGeminiGenerationMessage(session_id=session.id, role="user", content=prompt))
    db.add(ExamGeminiGenerationMessage(session_id=session.id, role="model", content=raw))
    session.updated_at = datetime.now(timezone.utc)


async def run_generation_batch(
    session: ExamGeminiGenerationSession,
    exam: Exam,
    series: list[GeminiSeriesInput],
    db: AsyncSession,
) -> None:
    params = _params(session)
    plan = _batch_plan(params)
    completed = int(params.get("completed_batches") or 0)
    if completed >= len(plan):
        raise HTTPException(status_code=400, detail="כל הקבוצות כבר נוצרו")
    batch = plan[completed]
    sources_block = params.get("sources_block") or ""
    accumulated = str(params.get("accumulated_raw") or "")
    started = time.monotonic()
    prompt = build_batch_generation_prompt(
        series,
        batch,
        exam_title=exam.title,
        sources_block=sources_block,
        accumulated_raw=accumulated,
    )
    logger.info(
        "AI batch %s/%s (session_id=%s, exam_id=%s, Q%s–Q%s)",
        completed + 1,
        len(plan),
        session.id,
        session.exam_id,
        batch.from_q,
        batch.from_q + batch.count - 1,
    )
    try:
        result = await _generate_batch_raw(
            series,
            batch,
            exam_title=exam.title,
            sources_block=sources_block,
            accumulated_raw=accumulated,
            plan=plan,
        )
    except HTTPException as exc:
        if _is_timeout_error(exc) and _can_switch_to_chunked(batch) and not params.get("chunked_fallback"):
            logger.info(
                "AI timeout — switching to chunked batches from Q%s (session_id=%s)",
                batch.from_q,
                session.id,
            )
            _apply_chunked_fallback(params, series, batch.from_q)
            _save_params(session, params)
            await run_generation_batch(session, exam, series, db)
            return
        raise
    if result.accepted_count > batch.count:
        logger.info(
            "AI returned %s questions in one response (batch expected %s, session_id=%s)",
            result.accepted_count,
            batch.count,
            session.id,
        )
    params["accumulated_raw"] = merge_accumulated_raw(accumulated, result.normalized_raw)
    params["completed_batches"] = completed_batches_after_accept(plan, completed, result.accepted_count)
    session.last_raw_text = params["accumulated_raw"]
    _save_params(session, params)
    await _record_batch_exchange(session, prompt, result.normalized_raw, db)
    logger.info(
        "AI batch done in %.1fs (session_id=%s, chars=%d)",
        time.monotonic() - started,
        session.id,
        len(result.normalized_raw),
    )


def init_batch_params(
    series: list[GeminiSeriesInput],
    source_ids: list[int],
    sources_block: str,
) -> dict:
    plan = build_batch_plan(series)
    return {
        "series": [s.model_dump() for s in series],
        "source_ids": source_ids,
        "sources_block": sources_block,
        "batch_plan": plan_to_params(plan),
        "completed_batches": 0,
        "accumulated_raw": "",
        "manual_refine": False,
        "chunked_fallback": False,
    }


def mark_manual_refine(session: ExamGeminiGenerationSession, raw: str) -> None:
    params = _params(session)
    plan = _batch_plan(params)
    params["accumulated_raw"] = raw
    params["completed_batches"] = len(plan)
    params["manual_refine"] = True
    _save_params(session, params)
    session.last_raw_text = raw


async def load_sources_block(
    exam_id: int,
    user,
    source_ids: list[int],
    db: AsyncSession,
) -> str:
    sources = await load_sources_for_generation(exam_id, user, source_ids, db)
    return build_sources_context_block(sources)
