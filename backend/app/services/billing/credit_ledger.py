"""Relie chaque crédit payé consommé à la חבילה la plus ancienne encore intacte."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.billing import PaymentOrder
from app.services.billing.constants import ORDER_PAID
from app.services.billing.credit_policy import PackSlice, consume_paid, restore_paid


def _slice(order: PaymentOrder) -> PackSlice:
    return PackSlice(order.id, order.credits, order.credits_remaining, order.paid_at)


async def paid_orders(db: AsyncSession, user_id: int, product: str) -> list[PaymentOrder]:
    stmt = (
        select(PaymentOrder)
        .where(
            PaymentOrder.user_id == user_id,
            PaymentOrder.product == product,
            PaymentOrder.status == ORDER_PAID,
        )
        .order_by(PaymentOrder.id.asc())
    )
    return list((await db.execute(stmt)).scalars().all())


def _apply(orders: list[PaymentOrder], chosen: PackSlice | None) -> None:
    if chosen is None:
        return
    for order in orders:
        if order.id == chosen.id:
            order.credits_remaining = chosen.remaining


async def consume_paid_credit(db: AsyncSession, user_id: int, product: str) -> None:
    orders = await paid_orders(db, user_id, product)
    _apply(orders, consume_paid([_slice(order) for order in orders]))


async def restore_paid_credit(db: AsyncSession, user_id: int, product: str) -> None:
    orders = await paid_orders(db, user_id, product)
    _apply(orders, restore_paid([_slice(order) for order in orders]))


async def void_paid_orders(db: AsyncSession, user_id: int, product: str | None = None) -> None:
    """Une clôture ou un réglage admin annule le droit au remboursement."""
    orders = await paid_orders(db, user_id, product) if product else await _all_paid(db, user_id)
    for order in orders:
        order.credits_remaining = 0


async def _all_paid(db: AsyncSession, user_id: int) -> list[PaymentOrder]:
    stmt = select(PaymentOrder).where(PaymentOrder.user_id == user_id, PaymentOrder.status == ORDER_PAID)
    return list((await db.execute(stmt)).scalars().all())
