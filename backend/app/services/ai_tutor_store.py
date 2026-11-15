"""Lecture / écriture des conversations du tuteur IA."""

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.ai_tutor import TutorConversation, TutorMessage


async def load_conversation(
    attempt_id: int, question_id: int, for_practice: bool, db: AsyncSession
) -> TutorConversation | None:
    row = await db.execute(
        select(TutorConversation)
        .options(selectinload(TutorConversation.messages))
        .where(
            TutorConversation.attempt_id == attempt_id,
            TutorConversation.question_id == question_id,
            TutorConversation.for_practice.is_(for_practice),
        )
    )
    return row.scalar_one_or_none()


async def get_or_create_conversation(
    attempt_id: int, question_id: int, for_practice: bool, db: AsyncSession
) -> TutorConversation:
    conv = await load_conversation(attempt_id, question_id, for_practice, db)
    if conv:
        return conv
    conv = TutorConversation(attempt_id=attempt_id, question_id=question_id, for_practice=for_practice)
    db.add(conv)
    await db.flush()
    await db.refresh(conv, ["messages"])
    return conv


async def count_attempt_user_messages(attempt_id: int, db: AsyncSession) -> int:
    """Messages élève sur toute la מטלה (examen + révision) : plafond par élève et par מטלה."""
    stmt = (
        select(func.count())
        .select_from(TutorMessage)
        .join(TutorConversation, TutorConversation.id == TutorMessage.conversation_id)
        .where(TutorConversation.attempt_id == attempt_id, TutorMessage.role == "user")
    )
    return int(await db.scalar(stmt) or 0)


def count_user_messages(conv: TutorConversation | None) -> int:
    if conv is None:
        return 0
    return sum(1 for m in conv.messages if m.role == "user")


async def delete_tutor_rows(
    db: AsyncSession,
    *,
    attempt_id: int | None = None,
    question_ids: list[int] | None = None,
    for_practice: bool | None = None,
) -> None:
    """Supprime conversations et messages (tentative recommencée, révision relancée, clé modifiée)."""
    conv_ids = select(TutorConversation.id)
    if attempt_id is not None:
        conv_ids = conv_ids.where(TutorConversation.attempt_id == attempt_id)
    if question_ids is not None:
        if not question_ids:
            return
        conv_ids = conv_ids.where(TutorConversation.question_id.in_(question_ids))
    if for_practice is not None:
        conv_ids = conv_ids.where(TutorConversation.for_practice.is_(for_practice))
    ids = list((await db.execute(conv_ids)).scalars().all())
    if not ids:
        return
    await db.execute(delete(TutorMessage).where(TutorMessage.conversation_id.in_(ids)))
    await db.execute(delete(TutorConversation).where(TutorConversation.id.in_(ids)))
