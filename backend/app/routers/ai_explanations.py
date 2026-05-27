from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.ai import AiExplanationResponse
from app.services.ai_explanation import explain_exam_question

router = APIRouter(prefix="/exams/sessions", tags=["ai"])


@router.post(
    "/{session_id}/questions/{question_id}/explain",
    response_model=AiExplanationResponse,
)
async def explain_question(
    session_id: int,
    question_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    text = await explain_exam_question(session_id, question_id, user, db)
    return AiExplanationResponse(question_id=question_id, explanation=text)
