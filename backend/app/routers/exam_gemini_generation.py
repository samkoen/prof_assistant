from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.exam import QuestionsImportRequest
from app.schemas.gemini_questions import (
    GeminiGenerationPreviewRequest,
    GeminiGenerationPreviewResponse,
    GeminiParseErrorReportRequest,
    GeminiSessionAcceptResponse,
    GeminiSessionCreateRequest,
    GeminiSessionRefineRequest,
    GeminiSessionResponse,
)
from app.services.exam_gemini_generation import (
    abandon_generation_session,
    accept_generation_session,
    create_generation_session,
    get_active_session_for_exam,
    get_generation_session,
    refine_generation_session,
    report_gemini_parse_error,
    run_next_generation_batch,
)
from app.services.gemini_generation_preview import preview_generation_context
from app.routers.exams import _get_teacher_exam

router = APIRouter(tags=["exam-gemini-generation"])


@router.post(
    "/exams/{exam_id}/gemini-sessions/preview",
    response_model=GeminiGenerationPreviewResponse,
)
async def preview_gemini_generation(
    exam_id: int,
    body: GeminiGenerationPreviewRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    exam = await _get_teacher_exam(exam_id, user, db)
    return await preview_generation_context(exam, user, body.series, body.source_ids, db)


@router.post("/exams/{exam_id}/gemini-sessions", response_model=GeminiSessionResponse)
async def start_gemini_session(
    exam_id: int,
    body: GeminiSessionCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    exam = await _get_teacher_exam(exam_id, user, db)
    return await create_generation_session(exam, user, body.series, db, body.source_ids)


@router.get("/exams/{exam_id}/gemini-sessions/active", response_model=GeminiSessionResponse | None)
async def get_active_gemini_session(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    await _get_teacher_exam(exam_id, user, db)
    return await get_active_session_for_exam(exam_id, user, db)


@router.get("/gemini-sessions/{session_id}", response_model=GeminiSessionResponse)
async def get_gemini_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    return await get_generation_session(session_id, user, db)


@router.post("/gemini-sessions/{session_id}/messages", response_model=GeminiSessionResponse)
async def refine_gemini_session(
    session_id: int,
    body: GeminiSessionRefineRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    return await refine_generation_session(session_id, user, body.message, db)


@router.post("/gemini-sessions/{session_id}/next-batch", response_model=GeminiSessionResponse)
async def next_gemini_batch(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    return await run_next_generation_batch(session_id, user, db)


@router.post("/gemini-sessions/{session_id}/abandon")
async def abandon_gemini_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    await abandon_generation_session(session_id, user, db)
    return {"ok": True}


@router.post("/gemini-sessions/{session_id}/report-parse-error")
async def report_gemini_parse_error_route(
    session_id: int,
    body: GeminiParseErrorReportRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    errors = [e.model_dump() for e in body.errors]
    sent = await report_gemini_parse_error(session_id, user, errors, db)
    return {"ok": True, "email_sent": sent}


@router.post("/gemini-sessions/{session_id}/accept", response_model=GeminiSessionAcceptResponse)
async def accept_gemini_session(
    session_id: int,
    body: QuestionsImportRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    count = await accept_generation_session(session_id, user, body, db)
    return GeminiSessionAcceptResponse(imported_count=count)
