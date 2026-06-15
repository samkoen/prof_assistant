from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.ai import AiExplanationRequest, AiExplanationResponse
from app.services.ai_explanation import (
    explain_exam_question,
    regenerate_exam_question_explanation,
)

router = APIRouter(prefix="/exams/sessions", tags=["ai"])


@router.post(
    "/{session_id}/questions/{question_id}/explain",
    response_model=AiExplanationResponse,
)
async def explain_question(
    session_id: int,
    question_id: int,
    body: AiExplanationRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    if body.regenerate:
        text = await regenerate_exam_question_explanation(
            session_id, question_id, body.language, user, db, for_practice=body.for_practice
        )
        return AiExplanationResponse(
            question_id=question_id, explanation=text, from_cache=False
        )
    text, from_cache = await explain_exam_question(
        session_id, question_id, body.language, user, db, for_practice=body.for_practice
    )
    return AiExplanationResponse(
        question_id=question_id,
        explanation=text,
        from_cache=from_cache,
    )
