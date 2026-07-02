import logging
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
    GeminiGenerationProgress,
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
from app.services.ai_client import AiError, generate_chat, generate_text
from app.services.gemini_batch_runner import (
    batch_progress,
    init_batch_params,
    load_sources_block,
    mark_manual_refine,
    run_generation_batch,
)
from app.services.gemini_debug_email import (
    last_user_prompt_before_model,
    send_gemini_parse_error_email,
)
from app.services.gemini_question_prompt import build_refine_user_message

logger = logging.getLogger(__name__)

MAX_REFINE_TURNS = 12


def _series_from_session(session: ExamGeminiGenerationSession) -> list[GeminiSeriesInput]:
    raw = (session.initial_params or {}).get("series") or []
    return [GeminiSeriesInput.model_validate(item) for item in raw]


def _message_to_response(
    msg: ExamGeminiGenerationMessage,
    *,
    slim_initial_prompt: bool = False,
) -> GeminiSessionMessageResponse:
    content = msg.content
    if slim_initial_prompt and msg.role == "user" and "בקשת עדכון מהמורה" not in content:
        if "עכשיו צור בדיוק" in content or "צור שאלות מבחן" in content:
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
    params = session.initial_params or {}
    progress = batch_progress(params)
    return GeminiSessionResponse(
        id=session.id,
        exam_id=session.exam_id,
        status=session.status,
        raw_text=session.last_raw_text,
        messages=[
            _message_to_response(m, slim_initial_prompt=slim_initial_prompt)
            for m in session.messages
        ],
        generation_progress=GeminiGenerationProgress(**progress),
        generation_warnings=list(params.get("generation_warnings") or []),
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


async def _call_opencode(session: ExamGeminiGenerationSession) -> str:
    messages = list(session.messages)
    try:
        if len(messages) == 1 and messages[0].role == "user":
            return await generate_text(messages[0].content, for_generation=True)
        contents = _contents_from_messages(messages)
        return await generate_chat(contents, for_generation=True)
    except AiError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


async def _append_refine_exchange(
    session: ExamGeminiGenerationSession,
    user_text: str,
    db: AsyncSession,
) -> str:
    logger.info(
        "AI refine prompt (session_id=%s, exam_id=%s):\n%s",
        session.id,
        session.exam_id,
        user_text,
    )
    db.add(
        ExamGeminiGenerationMessage(session_id=session.id, role="user", content=user_text)
    )
    await db.flush()
    await db.refresh(session, ["messages"])
    raw = await _call_opencode(session)
    db.add(
        ExamGeminiGenerationMessage(session_id=session.id, role="model", content=raw)
    )
    mark_manual_refine(session, raw)
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
    sources_block = await load_sources_block(exam.id, user, ids, db)
    session = ExamGeminiGenerationSession(
        exam_id=exam.id,
        teacher_id=user.id,
        initial_params=init_batch_params(series, ids, sources_block),
    )
    db.add(session)
    await db.flush()
    started = time.monotonic()
    await run_generation_batch(session, exam, series, db)
    logger.info(
        "gemini-sessions create exam_id=%s session_id=%s batch took %.1fs",
        exam.id,
        session.id,
        time.monotonic() - started,
    )
    await db.commit()
    return _session_to_response(
        await _load_owned_session(session.id, user, db),
        slim_initial_prompt=True,
    )


async def run_next_generation_batch(
    session_id: int,
    user: User,
    db: AsyncSession,
) -> GeminiSessionResponse:
    session = await _load_owned_session(session_id, user, db)
    if session.status != ExamGeminiSessionStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="השיחה אינה פעילה")
    params = session.initial_params or {}
    progress = batch_progress(params)
    if progress["complete"]:
        raise HTTPException(status_code=400, detail="כל הקבוצות כבר נוצרו")
    exam = await db.get(Exam, session.exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="מבחן לא נמצא")
    series = _series_from_session(session)
    started = time.monotonic()
    await run_generation_batch(session, exam, series, db)
    logger.info(
        "gemini-sessions next-batch session_id=%s took %.1fs",
        session.id,
        time.monotonic() - started,
    )
    await db.commit()
    return _session_to_response(await _load_owned_session(session_id, user, db))


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
    await _append_refine_exchange(session, refine_text, db)
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
    progress = batch_progress(session.initial_params or {})
    if not progress["complete"]:
        raise HTTPException(status_code=400, detail="היצירה עדיין לא הושלמה")
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
