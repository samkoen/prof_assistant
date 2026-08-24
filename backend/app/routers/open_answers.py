from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.open_answer import (
    GenerateModelAnswerRequest,
    GenerateModelAnswerResponse,
    OpenEvaluationRequest,
    OpenEvaluationResponse,
)
from app.services.open_answer_evaluation import (
    evaluate_open_answer,
    generate_model_answer_text,
)

router = APIRouter(prefix="/exams", tags=["open-answers"])


@router.post(
    "/sessions/{session_id}/questions/{question_id}/open-evaluate",
    response_model=OpenEvaluationResponse,
)
async def evaluate_open_question(
    session_id: int,
    question_id: int,
    body: OpenEvaluationRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    return await evaluate_open_answer(
        session_id,
        question_id,
        user,
        db,
        for_practice=body.for_practice,
        regenerate=body.regenerate,
    )


@router.post(
    "/{exam_id}/open-model-answer",
    response_model=GenerateModelAnswerResponse,
)
async def generate_open_model_answer(
    exam_id: int,
    body: GenerateModelAnswerRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    from app.routers.exams import _get_teacher_exam

    await _get_teacher_exam(exam_id, user, db)
    text = await generate_model_answer_text(body.question_text, body.language)
    return GenerateModelAnswerResponse(model_answer=text)
