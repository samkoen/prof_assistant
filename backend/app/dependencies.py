from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.security import COOKIE_NAME, decode_session_token


async def _user_from_session_cookie(
    db: AsyncSession,
    assistant_session: str | None,
) -> User | None:
    if not assistant_session:
        return None
    payload = decode_session_token(assistant_session)
    if not payload:
        return None
    result = await db.execute(select(User).where(User.id == int(payload["sub"])))
    user = result.scalar_one_or_none()
    if not user or user.is_blocked:
        return None
    return user


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    assistant_session: str | None = Cookie(default=None, alias=COOKIE_NAME),
) -> User:
    user = await _user_from_session_cookie(db, assistant_session)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="לא מחובר")
    if not user.email_verified and not user.email_verified_by_teacher:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="יש לאמת את האימייל")
    return user


def require_roles(*roles: UserRole):
    async def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="אין הרשאה")
        return user

    return checker


async def get_optional_current_user(
    db: AsyncSession = Depends(get_db),
    assistant_session: str | None = Cookie(default=None, alias=COOKIE_NAME),
) -> User | None:
    return await _user_from_session_cookie(db, assistant_session)
