"""Lecture et mouvement du portefeuille (gratuit d'abord, puis acheté)."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.billing import AiWallet
from app.services.billing.constants import BUCKET_FREE, BUCKET_PAID
from app.services.billing.settings_store import get_billing_config


def _maybe_lock(stmt, db: AsyncSession):
    if db.get_bind().dialect.name == "postgresql":
        return stmt.with_for_update()
    return stmt


async def lock_wallet(db: AsyncSession, user_id: int, product: str) -> AiWallet:
    stmt = _maybe_lock(
        select(AiWallet).where(AiWallet.user_id == user_id, AiWallet.product == product),
        db,
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row:
        return row
    config = await get_billing_config(db)
    row = AiWallet(
        user_id=user_id,
        product=product,
        free_remaining=config.free_for(product),
        paid_remaining=0,
    )
    db.add(row)
    await db.flush()
    return row


def take_one(wallet: AiWallet) -> str | None:
    if wallet.free_remaining > 0:
        wallet.free_remaining -= 1
        return BUCKET_FREE
    if wallet.paid_remaining > 0:
        wallet.paid_remaining -= 1
        return BUCKET_PAID
    return None


def refund_one(wallet: AiWallet, bucket: str) -> None:
    if bucket == BUCKET_PAID:
        wallet.paid_remaining += 1
        return
    wallet.free_remaining += 1


def wallet_total(wallet: AiWallet) -> int:
    return wallet.free_remaining + wallet.paid_remaining
