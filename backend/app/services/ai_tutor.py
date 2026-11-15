"""Tuteur IA côté élève : conversation question par question, après la correction.

Paiement : l'élève paie, comme pour l'explication IA (produit STUDENT_AI) - un crédit
à l'ouverture de la conversation d'une question, puis les messages suivants sont inclus
jusqu'aux plafonds de `config.py`.
"""

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.ai_tutor import TutorConversation, TutorMessage
from app.models.user import User
from app.schemas.ai_tutor import TutorMessageRequest, TutorMessageResponse, TutorThreadResponse
from app.services import ai_client
from app.services.ai_explanation import _resolve_language
from app.services.ai_tutor_access import TutorContext, load_tutor_context
from app.services.ai_tutor_prompt import build_contents, tutor_system_prompt
from app.services.ai_tutor_store import (
    count_attempt_user_messages,
    count_user_messages,
    get_or_create_conversation,
    load_conversation,
)
from app.services.billing.constants import STUDENT_AI
from app.services.billing.context import bill_ai, unbilled


def remaining(limit: int, used: int) -> int:
    return max(0, limit - used)


def limit_error(text: str, used: int, exam_used: int) -> str | None:
    """Message d'erreur (hébreu) si le message dépasse une limite, sinon None."""
    if len(text) > settings.ai_tutor_max_message_chars:
        return f"ההודעה ארוכה מדי (עד {settings.ai_tutor_max_message_chars} תווים)"
    if used >= settings.ai_tutor_max_messages_per_question:
        return "הגעת למספר ההודעות המרבי לשאלה זו"
    if exam_used >= settings.ai_tutor_max_messages_per_exam:
        return "הגעת למספר ההודעות המרבי לעוזר החכם במטלה זו"
    return None


async def _thread_response(
    ctx: TutorContext, conv: TutorConversation | None, db: AsyncSession
) -> TutorThreadResponse:
    exam_used = await count_attempt_user_messages(ctx.attempt.id, db)
    messages = list(conv.messages) if conv else []
    return TutorThreadResponse(
        question_id=ctx.question.id,
        messages=[TutorMessageResponse.model_validate(m) for m in messages],
        remaining_messages=remaining(settings.ai_tutor_max_messages_per_question, count_user_messages(conv)),
        exam_remaining_messages=remaining(settings.ai_tutor_max_messages_per_exam, exam_used),
        max_message_chars=settings.ai_tutor_max_message_chars,
        charged=bool(conv and conv.charged),
    )


async def get_tutor_thread(
    session_id: int, question_id: int, user: User, db: AsyncSession, *, for_practice: bool
) -> TutorThreadResponse:
    ctx = await load_tutor_context(session_id, question_id, user, db, for_practice=for_practice)
    conv = await load_conversation(ctx.attempt.id, ctx.question.id, for_practice, db)
    return await _thread_response(ctx, conv, db)


async def ask_tutor_model(
    ctx: TutorContext, conv: TutorConversation, user: User, text: str, action: str | None
) -> str:
    """Un seul crédit par conversation : le premier échange est facturé, les suivants non."""
    history = [(m.role, m.content) for m in conv.messages]
    contents = build_contents(history, text, action)
    system = tutor_system_prompt(ctx, _resolve_language(user))
    billing = unbilled() if conv.charged else bill_ai(user, STUDENT_AI)
    try:
        async with billing:
            return await ai_client.generate_chat(contents, system=system)
    except ai_client.AiError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


async def send_tutor_message(
    session_id: int, question_id: int, user: User, body: TutorMessageRequest, db: AsyncSession
) -> TutorThreadResponse:
    ctx = await load_tutor_context(session_id, question_id, user, db, for_practice=body.for_practice)
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="ההודעה ריקה")
    conv = await get_or_create_conversation(ctx.attempt.id, ctx.question.id, body.for_practice, db)
    exam_used = await count_attempt_user_messages(ctx.attempt.id, db)
    error = limit_error(text, count_user_messages(conv), exam_used)
    if error:
        raise HTTPException(status_code=429, detail=error)
    reply = await ask_tutor_model(ctx, conv, user, text, body.action)
    db.add(TutorMessage(conversation_id=conv.id, role="user", content=text))
    db.add(TutorMessage(conversation_id=conv.id, role="model", content=reply.strip()))
    conv.charged = True
    await db.commit()
    await db.refresh(conv, ["messages"])
    return await _thread_response(ctx, conv, db)
