from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.exam import QuestionsImportRequest
from app.schemas.gemini_questions import (
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
)
from app.routers.exams import _get_teacher_exam

router = APIRouter(tags=["exam-gemini-generation"])


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


@router.post("/gemini-sessions/{session_id}/abandon")
async def abandon_gemini_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    await abandon_generation_session(session_id, user, db)
    return {"ok": True}


@router.post("/gemini-sessions/{session_id}/accept", response_model=GeminiSessionAcceptResponse)
async def accept_gemini_session(
    session_id: int,
    body: QuestionsImportRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    count = await accept_generation_session(session_id, user, body, db)
    return GeminiSessionAcceptResponse(imported_count=count)
