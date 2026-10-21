"""Demande et application d'un nouveau mot de passe via lien e-mail."""

from enum import Enum

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.security import decode_password_reset_token, hash_password
from app.services import email as email_service
from app.services.auth_verification import find_user_by_email


class ResetOutcome(str, Enum):
    OK = "ok"
    INVALID = "invalid"
    BLOCKED = "blocked"


def can_send_reset(user: User | None) -> bool:
    return user is not None and not user.is_blocked


def assign_reset_password(user: User, new_password: str) -> None:
    user.password_hash = hash_password(new_password)
    user.email_verified = True


async def request_password_reset(db: AsyncSession, email: str) -> None:
    user = await find_user_by_email(db, email)
    if not can_send_reset(user):
        return
    assert user is not None
    await email_service.send_password_reset_email(user.email, user.id, user.full_name)


async def _user_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def reset_password_with_token(
    db: AsyncSession, token: str, new_password: str
) -> ResetOutcome:
    user_id = decode_password_reset_token(token)
    if user_id is None:
        return ResetOutcome.INVALID
    user = await _user_by_id(db, user_id)
    if user is None:
        return ResetOutcome.INVALID
    if user.is_blocked:
        return ResetOutcome.BLOCKED
    assign_reset_password(user, new_password)
    await db.commit()
    return ResetOutcome.OK
