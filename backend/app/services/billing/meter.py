"""Réservation d'un appel IA : confirmer si le modèle répond, rendre le crédit sinon."""

from dataclasses import dataclass

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.billing import AiUsage
from app.services.billing.constants import (
    TEACHER_GENERATION,
    USAGE_CONFIRMED,
    USAGE_PENDING,
    USAGE_RELEASED,
)
from app.services.billing.context import AiBilling, current_billing
from app.services.billing.settings_store import BillingConfig, get_billing_config
from app.services.billing.wallet import lock_wallet, refund_one, take_one


@dataclass(frozen=True)
class CreditHold:
    usage_id: int
    refund_if_pending: bool


def raise_credits_required(product: str, packs: list[dict]) -> None:
    raise HTTPException(
        status_code=402,
        detail={
            "code": "ai_credits_required",
            "message": "נגמרו קרדיטי ה-AI. יש לרכוש חבילה כדי להמשיך.",
            "product": product,
            "packs": packs,
        },
    )


def _maker():
    from app.database import async_session_maker

    return async_session_maker


async def _open_tranche(db: AsyncSession, billing: AiBilling) -> AiUsage | None:
    stmt = select(AiUsage).where(
        AiUsage.user_id == billing.user_id,
        AiUsage.product == TEACHER_GENERATION,
        AiUsage.status == USAGE_CONFIRMED,
        AiUsage.slots_used < AiUsage.slots_total,
    )
    if billing.generation_session_id is None:
        stmt = stmt.where(AiUsage.generation_session_id.is_(None))
    else:
        stmt = stmt.where(AiUsage.generation_session_id == billing.generation_session_id)
    stmt = stmt.order_by(AiUsage.id.asc()).limit(1)
    return (await db.execute(stmt)).scalar_one_or_none()


async def _open_credit(db: AsyncSession, billing: AiBilling, config: BillingConfig, slots: int) -> AiUsage:
    wallet = await lock_wallet(db, billing.user_id, billing.product)
    bucket = take_one(wallet)
    if bucket is None:
        raise_credits_required(billing.product, config.payloads_for(billing.product))
    usage = AiUsage(
        user_id=billing.user_id,
        product=billing.product,
        status=USAGE_PENDING,
        generation_session_id=billing.generation_session_id,
        slots_total=slots,
        slots_used=0,
        charged_bucket=bucket,
    )
    db.add(usage)
    await db.flush()
    return usage


async def _reserve(db: AsyncSession, billing: AiBilling) -> CreditHold:
    config = await get_billing_config(db)
    if billing.product == TEACHER_GENERATION:
        opened = await _open_tranche(db, billing)
        if opened:
            return CreditHold(opened.id, refund_if_pending=False)
        usage = await _open_credit(db, billing, config, config.calls_per_teacher_credit)
        return CreditHold(usage.id, refund_if_pending=True)
    usage = await _open_credit(db, billing, config, 1)
    return CreditHold(usage.id, refund_if_pending=True)


async def begin_hold() -> CreditHold | None:
    billing = current_billing()
    if billing is None or billing.role == "admin":
        return None
    async with _maker()() as db:
        hold = await _reserve(db, billing)
        await db.commit()
        return hold


async def confirm_hold(hold: CreditHold | None) -> None:
    if hold is None:
        return
    async with _maker()() as db:
        usage = await db.get(AiUsage, hold.usage_id)
        if usage is None or usage.status == USAGE_RELEASED:
            return
        usage.slots_used += 1
        usage.status = USAGE_CONFIRMED
        await db.commit()


async def release_hold(hold: CreditHold | None) -> None:
    if hold is None or not hold.refund_if_pending:
        return
    async with _maker()() as db:
        usage = await db.get(AiUsage, hold.usage_id)
        if usage is None or usage.status != USAGE_PENDING:
            return
        wallet = await lock_wallet(db, usage.user_id, usage.product)
        refund_one(wallet, usage.charged_bucket)
        usage.status = USAGE_RELEASED
        await db.commit()
