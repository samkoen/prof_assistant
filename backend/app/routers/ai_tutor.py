from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.ai_tutor import TutorMessageRequest, TutorThreadResponse
from app.services.ai_tutor import get_tutor_thread, send_tutor_message

router = APIRouter(prefix="/exams/sessions", tags=["ai"])


@router.get("/{session_id}/questions/{question_id}/tutor", response_model=TutorThreadResponse)
async def tutor_thread(
    session_id: int,
    question_id: int,
    for_practice: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    return await get_tutor_thread(session_id, question_id, user, db, for_practice=for_practice)


@router.post("/{session_id}/questions/{question_id}/tutor/messages", response_model=TutorThreadResponse)
async def tutor_message(
    session_id: int,
    question_id: int,
    body: TutorMessageRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    return await send_tutor_message(session_id, question_id, user, body, db)
