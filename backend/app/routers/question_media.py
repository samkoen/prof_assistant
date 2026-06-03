from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.enums import UserRole
from app.models.user import User
from app.routers.exams import _get_teacher_exam
from app.services.question_media import (
    assert_can_view_question_images,
    media_type_for,
    resolve_image_file,
    safe_filename,
    upload_question_image,
)

router = APIRouter(tags=["question-media"])


@router.post("/exams/{exam_id}/question-images")
async def post_question_image(
    exam_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    await _get_teacher_exam(exam_id, user, db)
    return await upload_question_image(exam_id, file, db)


@router.get("/exams/{exam_id}/question-images/{filename}")
async def get_question_image(
    exam_id: int,
    filename: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    safe_filename(filename)
    await assert_can_view_question_images(exam_id, user, db)
    path = resolve_image_file(exam_id, filename)
    return FileResponse(path, media_type=media_type_for(filename))
