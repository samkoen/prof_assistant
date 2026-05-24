from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.security import COOKIE_NAME, decode_access_token


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    assistant_session: str | None = Cookie(default=None, alias=COOKIE_NAME),
) -> User:
    if not assistant_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="לא מחובר")
    payload = decode_access_token(assistant_session)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="ההתחברות פגה")
    result = await db.execute(select(User).where(User.id == int(payload["sub"])))
    user = result.scalar_one_or_none()
    if not user or user.is_blocked:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="המשתמש חסום")
    if not user.email_verified and not user.email_verified_by_teacher:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="יש לאמת את האימייל")
    return user


def require_roles(*roles: UserRole):
    async def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="אין הרשאה")
        return user

    return checker
