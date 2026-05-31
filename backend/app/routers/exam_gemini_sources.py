from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.gemini_questions import GeminiSourceResponse, GeminiSourceUpdate
from app.services.exam_gemini_source_service import (
    delete_source,
    list_sources_for_exam,
    update_source_flags,
    upload_source,
)
from app.routers.exams import _get_teacher_exam

router = APIRouter(tags=["exam-gemini-sources"])


@router.get("/exams/{exam_id}/gemini-sources", response_model=list[GeminiSourceResponse])
async def list_exam_gemini_sources(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    await _get_teacher_exam(exam_id, user, db)
    return await list_sources_for_exam(exam_id, user, db)


@router.post("/exams/{exam_id}/gemini-sources", response_model=GeminiSourceResponse)
async def upload_exam_gemini_source(
    exam_id: int,
    source_type: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    await _get_teacher_exam(exam_id, user, db)
    return await upload_source(exam_id, user, file, source_type, db)


@router.patch("/gemini-sources/{source_id}", response_model=GeminiSourceResponse)
async def patch_gemini_source(
    source_id: int,
    body: GeminiSourceUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    return await update_source_flags(source_id, user, body, db)


@router.delete("/gemini-sources/{source_id}")
async def remove_gemini_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    await delete_source(source_id, user, db)
    return {"ok": True}
