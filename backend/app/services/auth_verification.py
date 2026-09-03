"""Renvoi de l'e-mail d'אימות sans recréer le compte."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services import email as email_service


def can_resend_verification(user: User | None) -> bool:
    if user is None:
        return False
    if user.is_blocked:
        return False
    if user.email_verified or user.email_verified_by_teacher:
        return False
    return True


async def find_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def resend_verification_for_email(db: AsyncSession, email: str) -> bool:
    user = await find_user_by_email(db, email)
    if not can_resend_verification(user):
        return False
    assert user is not None
    return await email_service.send_verification_email(user.email, user.id, user.full_name)
