from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
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
from app.services.gemini_client import GeminiError, generate_chat
from app.services.gemini_source_prompt import build_sources_context_block
from app.services.exam_gemini_source_service import load_sources_for_generation
from app.services.gemini_question_prompt import build_questions_generation_prompt
from app.services.gemini_text_cleanup import clean_gemini_user_text

MAX_REFINE_TURNS = 12
REFINE_USER_PREFIX = """בקשת עדכון מהמורה:
{message}

החזר את כל מערך השאלות המלא בפורמט הנדרש (מ-Q1 ברצף), לא רק את השינויים.
חובה: A) B) C) D) בלבד; ב-single בדיוק אפשרות אחת עם * (שורה * בלבד אחרי A) או * בסוף שורת האפשרות הנכונה)."""


def _series_to_params(series: list[GeminiSeriesInput]) -> list[dict]:
    return [s.model_dump() for s in series]


def _message_to_response(msg: ExamGeminiGenerationMessage) -> GeminiSessionMessageResponse:
    return GeminiSessionMessageResponse(
        id=msg.id,
        role=msg.role,
        content=msg.content,
        created_at=msg.created_at.isoformat(),
    )


def _session_to_response(session: ExamGeminiGenerationSession) -> GeminiSessionResponse:
    return GeminiSessionResponse(
        id=session.id,
        exam_id=session.exam_id,
        status=session.status,
        raw_text=session.last_raw_text,
        messages=[_message_to_response(m) for m in session.messages],
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


async def _call_gemini(session: ExamGeminiGenerationSession, db: AsyncSession) -> str:
    contents = _contents_from_messages(list(session.messages))
    try:
        return await generate_chat(
            contents,
            max_output_tokens=settings.gemini_generation_max_output_tokens,
            timeout_seconds=settings.gemini_generation_timeout_seconds,
            use_generation_fallbacks=True,
        )
    except GeminiError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


async def _append_exchange(
    session: ExamGeminiGenerationSession,
    user_text: str,
    db: AsyncSession,
) -> str:
    db.add(
        ExamGeminiGenerationMessage(session_id=session.id, role="user", content=user_text)
    )
    await db.flush()
    await db.refresh(session, ["messages"])
    raw = await _call_gemini(session, db)
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
    await _append_exchange(session, prompt, db)
    await db.commit()
    result = await db.execute(
        select(ExamGeminiGenerationSession)
        .options(selectinload(ExamGeminiGenerationSession.messages))
        .where(ExamGeminiGenerationSession.id == session.id)
    )
    return _session_to_response(result.scalar_one())


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
    refine_text = REFINE_USER_PREFIX.format(message=clean_gemini_user_text(message))
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
