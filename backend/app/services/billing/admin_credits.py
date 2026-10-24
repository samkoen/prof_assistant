"""Solde et attribution de crédits : réservé à l'admin (jamais via /billing)."""

from __future__ import annotations

import logging

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.billing import AiWallet
from app.models.user import User
from app.services.billing.balance import product_for_role
from app.services.billing.context import role_name
from app.services.billing.settings_store import BillingConfig, get_billing_config
from app.services.billing.credit_ledger import void_paid_orders
from app.services.billing.wallet import lock_wallet, wallet_total

logger = logging.getLogger(__name__)

MAX_ADMIN_CREDITS = 10_000


def credit_view(user: User, wallet: AiWallet | None, config: BillingConfig) -> dict:
    product = product_for_role(role_name(user))
    if product is None:
        return {"credits": None, "unlimited": True, "product": None}
    total = wallet_total(wallet) if wallet else config.free_for(product)
    return {"credits": total, "unlimited": False, "product": product}


async def load_wallets(db: AsyncSession, users: list[User]) -> dict[tuple[int, str], AiWallet]:
    ids = [u.id for u in users]
    if not ids:
        return {}
    rows = (await db.execute(select(AiWallet).where(AiWallet.user_id.in_(ids)))).scalars().all()
    return {(row.user_id, row.product): row for row in rows}


async def views_for_users(db: AsyncSession, users: list[User]) -> dict[int, dict]:
    config = await get_billing_config(db)
    wallets = await load_wallets(db, users)
    out: dict[int, dict] = {}
    for user in users:
        product = product_for_role(role_name(user))
        wallet = wallets.get((user.id, product)) if product else None
        out[user.id] = credit_view(user, wallet, config)
    return out


def _reject_non_billable(target: User) -> str:
    product = product_for_role(role_name(target))
    if product is None:
        raise HTTPException(status_code=400, detail="לא ניתן לעדכן קרדיטים למנהל")
    return product


async def set_user_credits(db: AsyncSession, actor: User, target: User, credits: int) -> dict:
    """Remplace la yitrah (gratuit + payé) par `credits`. Interdit hors admin."""
    if role_name(actor) != "admin":
        raise HTTPException(status_code=403, detail="אין הרשאה")
    product = _reject_non_billable(target)
    if credits < 0 or credits > MAX_ADMIN_CREDITS:
        raise HTTPException(status_code=400, detail="מספר קרדיטים לא תקין")
    wallet = await lock_wallet(db, target.id, product)
    previous = wallet_total(wallet)
    wallet.free_remaining = 0
    wallet.paid_remaining = credits
    await void_paid_orders(db, target.id, product)
    logger.info(
        "admin_set_credits actor=%s target=%s product=%s %s->%s",
        actor.id, target.id, product, previous, credits,
    )
    return {"user_id": target.id, "credits": credits, "product": product}
