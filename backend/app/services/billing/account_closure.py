"""Clôture d'un compte et remboursement d'une חבילה intacte."""

import logging
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

logger = logging.getLogger(__name__)

REFUND_BEFORE_CLOSE = "יש להחזיר קודם את החבילה שעומדת בתנאי ההחזר"


def _refuse_admin(target: User) -> None:
    if role_name(target) == "admin":
        raise HTTPException(status_code=400, detail="לא ניתן לסגור חשבון מנהל")


async def _refuse_if_refundable(db: AsyncSession, user_id: int) -> None:
    """Le תקנון promet le remboursement d'une חבילה intacte : la clôture ne doit pas l'effacer."""
    if await refundable_orders(db, user_id):
        raise HTTPException(status_code=400, detail=REFUND_BEFORE_CLOSE)


async def close_account(db: AsyncSession, target: User) -> None:
    """Bloque l'entrée et annule le solde. Les notes et les מטלות restent."""
    _refuse_admin(target)
    await _refuse_if_refundable(db, target.id)
    target.is_blocked = True
    wallets = (await db.execute(select(AiWallet).where(AiWallet.user_id == target.id))).scalars().all()
    voided = sum(wallet.free_remaining + wallet.paid_remaining for wallet in wallets)
    for wallet in wallets:
        wallet.free_remaining = 0
        wallet.paid_remaining = 0
    await void_paid_orders(db, target.id)
    logger.info("account_closed user=%s credits_voided=%s", target.id, voided)


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


def _refund_amount(order: PaymentOrder) -> int:
    """Une חבילה d'avant le suivi (NULL) remboursée chez PayMe perd tous ses crédits."""
    if order.credits_remaining is None:
        return order.credits
    return order.credits_remaining


async def _drop_credits(db: AsyncSession, order: PaymentOrder) -> None:
    amount = _refund_amount(order)
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
    logger.info("external_refund order=%s user=%s sale=%s", order.id, order.user_id, order.payme_sale_id)


async def _lock_order(db: AsyncSession, order_id: int) -> PaymentOrder:
    stmt = select(PaymentOrder).where(PaymentOrder.id == order_id)
    if db.get_bind().dialect.name == "postgresql":
        stmt = stmt.with_for_update()
    return (await db.execute(stmt)).scalar_one()


async def _reserve_pack(db: AsyncSession, order: PaymentOrder, now: datetime) -> int:
    """Retire les crédits avant PayMe. Le portefeuille est verrouillé avant la commande."""
    await lock_wallet(db, order.user_id, order.product)
    locked = await _lock_order(db, order.id)
    reason = _reason(locked, now)
    if reason:
        raise HTTPException(status_code=400, detail=REFUND_REASONS[reason])
    amount = locked.credits_remaining or 0
    await _drop_credits(db, locked)
    locked.credits_remaining = 0
    await db.flush()
    return amount


async def _undo_reserve(db: AsyncSession, order: PaymentOrder, amount: int) -> None:
    order.credits_remaining = amount
    if amount <= 0:
        return
    wallet = await lock_wallet(db, order.user_id, order.product)
    wallet.paid_remaining += amount


async def _ensure_refunded_at_payme(order: PaymentOrder) -> None:
    try:
        await refund_sale(order.payme_sale_id or "")
    except HTTPException:
        item = await fetch_sale(order.transaction_id)
        status = str((item or {}).get("sale_status") or "").lower()
        if status != "refunded":
            raise


async def refund_unused_pack(db: AsyncSession, order: PaymentOrder, now: datetime | None = None) -> None:
    amount = await _reserve_pack(db, order, now or datetime.now(timezone.utc))
    await db.commit()
    try:
        await _ensure_refunded_at_payme(order)
    except HTTPException as exc:
        await _undo_reserve(db, order, amount)
        await db.commit()
        logger.warning("refund_failed order=%s user=%s detail=%s", order.id, order.user_id, exc.detail)
        raise
    order.status = ORDER_REFUNDED
    order.credits_remaining = 0
    logger.info("refund_done order=%s user=%s sale=%s credits=%s", order.id, order.user_id, order.payme_sale_id, amount)
