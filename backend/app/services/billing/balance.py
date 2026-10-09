"""Solde affiché : le quota gratuit est créé à la première lecture."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.billing.constants import STUDENT_AI, TEACHER_GENERATION
from app.services.billing.context import role_name
from app.services.billing.wallet import lock_wallet


def _view(product: str, free: int, paid: int, *, unlimited: bool) -> dict:
    return {
        "product": product,
        "free_remaining": free,
        "paid_remaining": paid,
        "total": free + paid,
        "unlimited": unlimited,
    }


def _unlimited() -> dict:
    wallets = [
        _view(STUDENT_AI, 0, 0, unlimited=True),
        _view(TEACHER_GENERATION, 0, 0, unlimited=True),
    ]
    return {"wallets": wallets}


async def balance_for(user: User, db: AsyncSession) -> dict:
    role = role_name(user)
    if role == "admin":
        return _unlimited()
    product = TEACHER_GENERATION if role == "teacher" else STUDENT_AI
    wallet = await lock_wallet(db, user.id, product)
    await db.commit()
    return {"wallets": [_view(product, wallet.free_remaining, wallet.paid_remaining, unlimited=False)]}


def product_for_role(role: str) -> str | None:
    if role == "teacher":
        return TEACHER_GENERATION
    if role == "student":
        return STUDENT_AI
    return None
