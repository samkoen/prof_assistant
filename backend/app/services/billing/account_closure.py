"""Clôture d'un compte et remboursement d'une חבילה intacte."""

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.billing import AiWallet, PaymentOrder
from app.models.user import User
from app.services.billing.constants import ORDER_PAID, ORDER_REFUNDED
from app.services.billing.context import role_name
from app.services.billing.credit_ledger import void_paid_orders
from app.services.billing.credit_policy import REFUND_REASONS, refund_block_reason
from app.services.billing.payme_client import fetch_sale, refund_sale
from app.services.billing.wallet import lock_wallet


def _refuse_admin(target: User) -> None:
    if role_name(target) == "admin":
        raise HTTPException(status_code=400, detail="לא ניתן לסגור חשבון מנהל")


async def close_account(db: AsyncSession, target: User) -> None:
    """Bloque l'entrée et annule le solde. Les notes et les מטלות restent."""
    _refuse_admin(target)
    target.is_blocked = True
    wallets = (await db.execute(select(AiWallet).where(AiWallet.user_id == target.id))).scalars().all()
    for wallet in wallets:
        wallet.free_remaining = 0
        wallet.paid_remaining = 0
    await void_paid_orders(db, target.id)


def _reason(order: PaymentOrder, now: datetime) -> str | None:
    return refund_block_reason(
        status=order.status,
        paid_at=order.paid_at,
        credits=order.credits,
        credits_remaining=order.credits_remaining,
        payme_sale_id=order.payme_sale_id,
        now=now,
    )


async def refundable_orders(db: AsyncSession, user_id: int, now: datetime | None = None) -> list[PaymentOrder]:
    moment = now or datetime.now(timezone.utc)
    stmt = select(PaymentOrder).where(PaymentOrder.user_id == user_id, PaymentOrder.status == ORDER_PAID)
    orders = (await db.execute(stmt)).scalars().all()
    return [order for order in orders if _reason(order, moment) is None]


async def _drop_credits(db: AsyncSession, order: PaymentOrder) -> None:
    amount = order.credits_remaining or 0
    if amount <= 0:
        return
    wallet = await lock_wallet(db, order.user_id, order.product)
    wallet.paid_remaining = max(0, wallet.paid_remaining - amount)


async def note_external_refund(db: AsyncSession, order: PaymentOrder) -> None:
    if order.status == ORDER_REFUNDED:
        return
    if order.status == ORDER_PAID:
        await _drop_credits(db, order)
    order.credits_remaining = 0
    order.status = ORDER_REFUNDED


async def _ensure_refunded_at_payme(order: PaymentOrder) -> None:
    try:
        await refund_sale(order.payme_sale_id or "")
    except HTTPException:
        item = await fetch_sale(order.transaction_id)
        status = str((item or {}).get("sale_status") or "").lower()
        if status != "refunded":
            raise


async def refund_unused_pack(db: AsyncSession, order: PaymentOrder, now: datetime | None = None) -> None:
    reason = _reason(order, now or datetime.now(timezone.utc))
    if reason:
        raise HTTPException(status_code=400, detail=REFUND_REASONS[reason])
    await _ensure_refunded_at_payme(order)
    await note_external_refund(db, order)
