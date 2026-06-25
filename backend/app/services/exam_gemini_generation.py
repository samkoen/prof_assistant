import logging
from datetime import datetime, timezone
import time

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.exam import Exam
from app.models.exam_gemini_generation import (
    ExamGeminiGenerationMessage,
    ExamGeminiGenerationSession,
    ExamGeminiSessionStatus,
)
from app.models.user import User
from app.schemas.exam import QuestionsImportRequest
from app.schemas.gemini_questions import (
    GeminiSeriesInput,
    GeminiSessionMessageResponse,
    GeminiSessionResponse,
)
from app.services.exam_questions import (
    exam_has_active_sessions,
    next_question_order_index,
    persist_question,
    validate_question_body,
)
from app.services.opencode_client import OpenCodeError, generate_chat, generate_text
from app.services.gemini_source_prompt import build_sources_context_block
from app.services.exam_gemini_source_service import load_sources_for_generation
from app.services.gemini_debug_email import (
    last_user_prompt_before_model,
    send_gemini_parse_error_email,
)
from app.services.gemini_question_prompt import (
    build_questions_generation_prompt,
    build_refine_user_message,
)

logger = logging.getLogger(__name__)

MAX_REFINE_TURNS = 12


def _series_from_session(session: ExamGeminiGenerationSession) -> list[GeminiSeriesInput]:
    raw = (session.initial_params or {}).get("series") or []
    return [GeminiSeriesInput.model_validate(item) for item in raw]


def _series_to_params(series: list[GeminiSeriesInput]) -> list[dict]:
    return [s.model_dump() for s in series]


def _message_to_response(
    msg: ExamGeminiGenerationMessage,
    *,
    slim_initial_prompt: bool = False,
) -> GeminiSessionMessageResponse:
    content = msg.content
    if slim_initial_prompt and msg.role == "user" and "בקשת עדכון מהמורה" not in content:
        content = "…"
    return GeminiSessionMessageResponse(
        id=msg.id,
        role=msg.role,
        content=content,
        created_at=msg.created_at.isoformat(),
    )


def _session_to_response(
    session: ExamGeminiGenerationSession,
    *,
    slim_initial_prompt: bool = False,
) -> GeminiSessionResponse:
    return GeminiSessionResponse(
        id=session.id,
        exam_id=session.exam_id,
        status=session.status,
        raw_text=session.last_raw_text,
        messages=[
            _message_to_response(m, slim_initial_prompt=slim_initial_prompt)
            for m in session.messages
        ],
    )


def _contents_from_messages(messages: list[ExamGeminiGenerationMessage]) -> list[dict]:
    out: list[dict] = []
    for msg in messages:
        role = "model" if msg.role == "model" else "user"
        out.append({"role": role, "parts": [{"text": msg.content}]})
    return out


async def _abandon_active_sessions(
    exam_id: int, teacher_id: int, db: AsyncSession
) -> None:
    result = await db.execute(
        select(ExamGeminiGenerationSession).where(
            ExamGeminiGenerationSession.exam_id == exam_id,
            ExamGeminiGenerationSession.teacher_id == teacher_id,
            ExamGeminiGenerationSession.status == ExamGeminiSessionStatus.ACTIVE,
        )
    )
    for session in result.scalars().all():
        session.status = ExamGeminiSessionStatus.ABANDONED


async def _load_owned_session(
    session_id: int, user: User, db: AsyncSession
) -> ExamGeminiGenerationSession:
    result = await db.execute(
        select(ExamGeminiGenerationSession)
        .options(selectinload(ExamGeminiGenerationSession.messages))
        .where(ExamGeminiGenerationSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session or session.teacher_id != user.id:
        raise HTTPException(status_code=404, detail="שיחה לא נמצאה")
    return session


async def _call_opencode(session: ExamGeminiGenerationSession, db: AsyncSession) -> str:
    messages = list(session.messages)
    try:
        if len(messages) == 1 and messages[0].role == "user":
            return await generate_text(messages[0].content, for_generation=True)
        contents = _contents_from_messages(messages)
        return await generate_chat(contents, for_generation=True)
    except OpenCodeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


async def _append_exchange(
    session: ExamGeminiGenerationSession,
    user_text: str,
    db: AsyncSession,
) -> str:
    logger.info(
        "AI generation prompt (session_id=%s, exam_id=%s):\n%s",
        session.id,
        session.exam_id,
        user_text,
    )
    db.add(
        ExamGeminiGenerationMessage(session_id=session.id, role="user", content=user_text)
    )
    await db.flush()
    await db.refresh(session, ["messages"])
    raw = await _call_opencode(session, db)
    db.add(
        ExamGeminiGenerationMessage(session_id=session.id, role="model", content=raw)
    )
    session.last_raw_text = raw
    session.updated_at = datetime.now(timezone.utc)
    return raw


async def create_generation_session(
    exam: Exam,
    user: User,
    series: list[GeminiSeriesInput],
    db: AsyncSession,
    source_ids: list[int] | None = None,
) -> GeminiSessionResponse:
    if await exam_has_active_sessions(exam.id, db):
        raise HTTPException(status_code=400, detail="לא ניתן לערוך מבחן פעיל")
    await _abandon_active_sessions(exam.id, user.id, db)
    ids = source_ids or []
    sources = await load_sources_for_generation(exam.id, user, ids, db)
    session = ExamGeminiGenerationSession(
        exam_id=exam.id,
        teacher_id=user.id,
        initial_params={"series": _series_to_params(series), "source_ids": ids},
    )
    db.add(session)
    await db.flush()
    sources_block = build_sources_context_block(sources)
    prompt = build_questions_generation_prompt(series, exam.title, sources_block)
    started = time.monotonic()
    await _append_exchange(session, prompt, db)
    logger.info(
        "gemini-sessions create exam_id=%s session_id=%s took %.1fs",
        exam.id,
        session.id,
        time.monotonic() - started,
    )
    await db.commit()
    result = await db.execute(
        select(ExamGeminiGenerationSession)
        .options(selectinload(ExamGeminiGenerationSession.messages))
        .where(ExamGeminiGenerationSession.id == session.id)
    )
    return _session_to_response(result.scalar_one(), slim_initial_prompt=True)


async def refine_generation_session(
    session_id: int,
    user: User,
    message: str,
    db: AsyncSession,
) -> GeminiSessionResponse:
    session = await _load_owned_session(session_id, user, db)
    if session.status != ExamGeminiSessionStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="השיחה אינה פעילה")
    user_turns = sum(1 for m in session.messages if m.role == "user")
    if user_turns >= MAX_REFINE_TURNS:
        raise HTTPException(status_code=400, detail="הגעתם למספר המקסימלי של בקשות עדכון")
    refine_text = build_refine_user_message(message, _series_from_session(session))
    await _append_exchange(session, refine_text, db)
    await db.commit()
    return _session_to_response(await _load_owned_session(session_id, user, db))


async def get_generation_session(
    session_id: int, user: User, db: AsyncSession
) -> GeminiSessionResponse:
    session = await _load_owned_session(session_id, user, db)
    return _session_to_response(session)


async def get_active_session_for_exam(
    exam_id: int, user: User, db: AsyncSession
) -> GeminiSessionResponse | None:
    result = await db.execute(
        select(ExamGeminiGenerationSession)
        .options(selectinload(ExamGeminiGenerationSession.messages))
        .where(
            ExamGeminiGenerationSession.exam_id == exam_id,
            ExamGeminiGenerationSession.teacher_id == user.id,
            ExamGeminiGenerationSession.status == ExamGeminiSessionStatus.ACTIVE,
        )
        .order_by(ExamGeminiGenerationSession.created_at.desc())
        .limit(1)
    )
    session = result.scalar_one_or_none()
    return _session_to_response(session) if session else None


async def abandon_generation_session(
    session_id: int, user: User, db: AsyncSession
) -> None:
    session = await _load_owned_session(session_id, user, db)
    session.status = ExamGeminiSessionStatus.ABANDONED
    await db.commit()


async def report_gemini_parse_error(
    session_id: int,
    user: User,
    errors: list[dict],
    db: AsyncSession,
) -> bool:
    session = await _load_owned_session(session_id, user, db)
    raw_text = (session.last_raw_text or "").strip()
    if not raw_text:
        return False
    prompt = last_user_prompt_before_model(list(session.messages))
    label = f"{user.full_name or user.email} <{user.email}>"
    return send_gemini_parse_error_email(
        exam_id=session.exam_id,
        session_id=session.id,
        teacher_label=label,
        errors=errors,
        prompt=prompt,
        raw_text=raw_text,
    )


async def accept_generation_session(
    session_id: int,
    user: User,
    import_body: QuestionsImportRequest,
    db: AsyncSession,
) -> int:
    session = await _load_owned_session(session_id, user, db)
    if session.status != ExamGeminiSessionStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="השיחה אינה פעילה")
    exam = await db.get(Exam, session.exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="מבחן לא נמצא")
    if await exam_has_active_sessions(exam.id, db):
        raise HTTPException(status_code=400, detail="לא ניתן לערוך מבחן פעיל")
    if import_body.questions_language is not None:
        exam.questions_language = import_body.questions_language
    start_idx = await next_question_order_index(exam.id, db)
    for i, q in enumerate(import_body.questions):
        validate_question_body(q, i)
        await persist_question(exam.id, q, start_idx + i, db)
    session.status = ExamGeminiSessionStatus.ACCEPTED
    await db.commit()
    return len(import_body.questions)
