"""Routes des parties d'un examen (חלק א', חלק ב'…) : consigne et règle « répondre à N questions »."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import UserRole
from app.models.exam import Exam
from app.models.user import User
from app.routers.exams import _get_teacher_exam
from app.schemas.exam import (
    ExamSectionAssignRequest,
    ExamSectionBody,
    ExamSectionResponse,
    ExamSectionsReorderRequest,
)
from app.services.exam_kind import is_task
from app.services.exam_questions import exam_has_active_sessions
from app.services.exam_sections import (
    add_section,
    assign_questions,
    delete_section,
    list_sections,
    reorder_sections,
    update_section,
)

router = APIRouter(prefix="/exams", tags=["exam-sections"])

_EDITORS = require_roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.STUDENT)


async def _editable_exam(exam_id: int, user: User, db: AsyncSession) -> Exam:
    exam = await _get_teacher_exam(exam_id, user, db)
    if is_task(exam):
        raise HTTPException(status_code=400, detail="משימה אינה מכילה חלקים")
    if await exam_has_active_sessions(exam_id, db):
        raise HTTPException(status_code=400, detail="לא ניתן לערוך מבחן פעיל")
    return exam


@router.get("/{exam_id}/sections", response_model=list[ExamSectionResponse])
async def get_sections(exam_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(_EDITORS)):
    exam = await _get_teacher_exam(exam_id, user, db)
    return await list_sections(exam.id, db)


@router.post("/{exam_id}/sections", response_model=ExamSectionResponse)
async def post_section(
    exam_id: int, body: ExamSectionBody, db: AsyncSession = Depends(get_db), user: User = Depends(_EDITORS)
):
    exam = await _editable_exam(exam_id, user, db)
    section = await add_section(exam.id, body, db)
    await db.commit()
    await db.refresh(section)
    return section


@router.put("/{exam_id}/sections/reorder", response_model=list[ExamSectionResponse])
async def put_sections_order(
    exam_id: int,
    body: ExamSectionsReorderRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_EDITORS),
):
    exam = await _editable_exam(exam_id, user, db)
    await reorder_sections(exam.id, body.section_ids, db)
    await db.commit()
    return await list_sections(exam.id, db)


@router.put("/{exam_id}/sections/assign", status_code=204)
async def put_question_sections(
    exam_id: int,
    body: ExamSectionAssignRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_EDITORS),
):
    exam = await _editable_exam(exam_id, user, db)
    await assign_questions(exam.id, body.question_ids, body.section_id, db)
    await db.commit()


@router.patch("/{exam_id}/sections/{section_id}", response_model=ExamSectionResponse)
async def patch_section(
    exam_id: int,
    section_id: int,
    body: ExamSectionBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_EDITORS),
):
    exam = await _editable_exam(exam_id, user, db)
    section = await update_section(exam.id, section_id, body, db)
    await db.commit()
    await db.refresh(section)
    return section


@router.delete("/{exam_id}/sections/{section_id}", status_code=204)
async def remove_section(
    exam_id: int, section_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(_EDITORS)
):
    exam = await _editable_exam(exam_id, user, db)
    await delete_section(exam.id, section_id, db)
    await db.commit()
