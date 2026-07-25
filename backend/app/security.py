from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.config import settings
from app.models.enums import UserRole

ALGORITHM = "HS256"
COOKIE_NAME = "assistant_session"
EMAIL_VERIFY_PURPOSE = "email_verify"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def _as_role(role: UserRole | str) -> UserRole:
    """SQLAlchemy peut renvoyer role comme str depuis la colonne VARCHAR."""
    return role if isinstance(role, UserRole) else UserRole(role)


def create_access_token(user_id: int, role: UserRole | str) -> str:
    role_enum = _as_role(role)
    days = (
        settings.access_token_expire_days_student
        if role_enum == UserRole.STUDENT
        else settings.access_token_expire_days_staff
    )
    expire = datetime.now(timezone.utc) + timedelta(days=days)
    payload = {"sub": str(user_id), "role": role_enum.value, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None


def decode_session_token(token: str) -> dict | None:
    """JWT de session uniquement — refuse les tokens à purpose (ex. email_verify)."""
    data = decode_access_token(token)
    if not data or "sub" not in data or data.get("purpose"):
        return None
    return data


def create_email_verification_token(user_id: int) -> str:
    hours = settings.email_verify_expire_hours
    expire = datetime.now(timezone.utc) + timedelta(hours=hours)
    payload = {"sub": str(user_id), "purpose": EMAIL_VERIFY_PURPOSE, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_email_verification_token(token: str) -> int | None:
    data = decode_access_token(token)
    if not data or data.get("purpose") != EMAIL_VERIFY_PURPOSE:
        return None
    try:
        return int(data["sub"])
    except (KeyError, TypeError, ValueError):
        return None
