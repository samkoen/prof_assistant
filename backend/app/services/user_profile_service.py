"""Mise à jour du profil par l'utilisateur connecté."""

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import UserRole
from app.models.user import User
from app.schemas.auth import UserProfileUpdateRequest
from app.security import hash_password, verify_password
from app.services.auth_messages import EMAIL_ALREADY_EXISTS
from app.services.email import send_verification_email


async def _email_taken(db: AsyncSession, email: str, user_id: int) -> bool:
    result = await db.execute(
        select(User.id).where(User.email == email.lower(), User.id != user_id)
    )
    return result.scalar_one_or_none() is not None


def _apply_password(user: User, body: UserProfileUpdateRequest) -> None:
    if body.new_password is None:
        return
    if not body.current_password:
        raise HTTPException(status_code=400, detail="נדרשת סיסמה נוכחית")
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="הסיסמה הנוכחית שגויה")
    user.password_hash = hash_password(body.new_password)


async def _apply_email_change(
    db: AsyncSession,
    user: User,
    new_email: str,
) -> bool:
    normalized = new_email.lower()
    if normalized == user.email.lower():
        return False
    if await _email_taken(db, normalized, user.id):
        raise HTTPException(status_code=400, detail=EMAIL_ALREADY_EXISTS)
    user.email = normalized
    user.email_verified = False
    user.email_verified_by_teacher = False
    return True


def _apply_optional_fields(user: User, data: dict) -> None:
    if "full_name" in data:
        user.full_name = data["full_name"].strip()
    if "phone" in data:
        user.phone = data["phone"] or None
    if "student_id" in data and user.role == UserRole.STUDENT:
        user.student_id = data["student_id"] or None


async def update_user_profile(
    db: AsyncSession,
    user: User,
    body: UserProfileUpdateRequest,
) -> tuple[User, bool]:
    data = body.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="לא נמצאו שינויים")

    email_sent = False
    _apply_password(user, body)
    _apply_optional_fields(user, data)

    if "email" in data:
        email_sent = await _apply_email_change(db, user, data["email"])

    await db.commit()
    await db.refresh(user)

    if email_sent:
        await send_verification_email(user.email, user.id, user.full_name)
    return user, email_sent
