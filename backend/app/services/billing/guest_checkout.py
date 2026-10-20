"""Achat sans connexion : le compte doit déjà exister."""

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.billing.checkout import start_checkout

UNKNOWN_BUYER = "האימייל לא קיים במערכת"
INVALID_EMAIL = "אימייל לא תקין"


def normalize_buyer_email(raw: str) -> str:
    return raw.strip().lower()


def _email_ok(email: str) -> bool:
    if " " in email or email.count("@") != 1:
        return False
    local, domain = email.split("@")
    return bool(local) and "." in domain and not domain.startswith(".") and not domain.endswith(".")


async def buyer_for_checkout(db: AsyncSession, raw_email: str) -> User:
    email = normalize_buyer_email(raw_email)
    if not _email_ok(email):
        raise HTTPException(status_code=400, detail=INVALID_EMAIL)
    stmt = select(User).where(User.email == email)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail=UNKNOWN_BUYER)
    return user


async def start_guest_checkout(raw_email: str, pack_code: str, db: AsyncSession):
    user = await buyer_for_checkout(db, raw_email)
    return await start_checkout(user, pack_code, db)
