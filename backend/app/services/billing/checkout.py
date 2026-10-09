"""Création de commande et crédit unique au webhook PayMe."""

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.billing import PaymentOrder
from app.models.user import User
from app.services.billing.constants import ORDER_FAILED, ORDER_PAID, ORDER_PENDING
from app.services.billing.context import role_name
from app.services.billing.packs import CreditPack, pack_label, require_pack_for_role
from app.services.billing.settings_store import get_billing_config
from app.services.billing.payme import COMPLETED_STATUSES, parse_sale_url, price_matches, signature_matches
from app.services.billing.payme_client import (
    NOT_CONFIGURED,
    create_sale,
    fetch_sale,
    payme_ready,
    public_base,
    webhook_secret,
)
from app.services.billing.wallet import lock_wallet


def _return_url(transaction_id: str) -> str:
    front = settings.frontend_url.rstrip("/")
    return f"{front}/billing/return?order={transaction_id}"


def sale_body(order: PaymentOrder, pack: CreditPack) -> dict:
    return {
        "seller_payme_id": settings.payme_seller_id.strip(),
        "sale_price": order.amount_agorot,
        "currency": "ILS",
        "product_name": pack_label(pack),
        "transaction_id": order.transaction_id,
        "sale_callback_url": f"{public_base()}/api/billing/payme/webhook",
        "sale_return_url": _return_url(order.transaction_id),
        "language": "he",
    }


async def start_checkout(user: User, pack_code: str, db: AsyncSession) -> tuple[PaymentOrder, str]:
    if not payme_ready():
        raise HTTPException(status_code=503, detail=NOT_CONFIGURED)
    config = await get_billing_config(db)
    pack = require_pack_for_role(pack_code, role_name(user), config.packs)
    order = PaymentOrder(
        user_id=user.id,
        pack_code=pack.code,
        product=pack.product,
        credits=pack.credits,
        amount_agorot=pack.amount_agorot,
        status=ORDER_PENDING,
        transaction_id=uuid4().hex,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    data = await create_sale(sale_body(order, pack))
    try:
        url = parse_sale_url(data)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="PayMe לא אישר את התשלום") from exc
    order.payme_sale_id = (data.get("payme_sale_id") or None)
    await db.commit()
    return order, url


async def _find_order(db: AsyncSession, transaction_id: str) -> PaymentOrder | None:
    stmt = select(PaymentOrder).where(PaymentOrder.transaction_id == transaction_id)
    return (await db.execute(stmt)).scalar_one_or_none()


async def _mark_paid(db: AsyncSession, order: PaymentOrder, payload: dict) -> None:
    order.status = ORDER_PAID
    order.paid_at = datetime.now(timezone.utc)
    sale_id = str(payload.get("payme_sale_id") or "").strip()
    if sale_id:
        order.payme_sale_id = sale_id
    txn = str(payload.get("payme_transaction_id") or "").strip()
    if txn:
        order.payme_transaction_id = txn
    wallet = await lock_wallet(db, order.user_id, order.product)
    wallet.paid_remaining += order.credits


def _signed(payload: dict) -> bool:
    secret = webhook_secret()
    return bool(secret) and signature_matches(payload, secret)


def _notified_status(payload: dict) -> str:
    raw = payload.get("sale_status") or payload.get("payme_status") or ""
    return str(raw).strip().lower()


def _sale_is_paid(item: dict | None, amount_agorot: int) -> bool:
    if not isinstance(item, dict):
        return False
    status = str(item.get("sale_status") or "").strip().lower()
    if status not in COMPLETED_STATUSES:
        return False
    return price_matches({"price": item.get("sale_price")}, amount_agorot)


def _paid_payload(item: dict) -> dict:
    sale_id = item.get("sale_payme_id") or item.get("payme_sale_id") or ""
    return {"payme_sale_id": sale_id, "payme_transaction_id": item.get("payme_transaction_id") or ""}


async def _apply_signed(payload: dict, order: PaymentOrder, db: AsyncSession) -> str:
    if order.status == ORDER_PAID:
        return "already_paid"
    if _notified_status(payload) not in COMPLETED_STATUSES:
        order.status = ORDER_FAILED
        await db.commit()
        return "failed"
    if not price_matches(payload, order.amount_agorot):
        raise HTTPException(status_code=400, detail="סכום לא תואם")
    await _mark_paid(db, order, payload)
    await db.commit()
    return "paid"


async def _fail_if_terminal(order: PaymentOrder, db: AsyncSession, item: dict | None) -> str:
    if not isinstance(item, dict):
        return "pending"
    status = str(item.get("sale_status") or "").strip().lower()
    if status not in {"failed", "canceled", "voided", "refunded"}:
        return "pending"
    order.status = ORDER_FAILED
    await db.commit()
    return "failed"


async def confirm_order_with_payme(order: PaymentOrder, db: AsyncSession) -> str:
    if order.status == ORDER_PAID:
        return "already_paid"
    item = await fetch_sale(order.transaction_id)
    if not _sale_is_paid(item, order.amount_agorot):
        return await _fail_if_terminal(order, db, item)
    await _mark_paid(db, order, _paid_payload(item or {}))
    await db.commit()
    return "paid"


async def apply_webhook(payload: dict, db: AsyncSession) -> str:
    order = await _find_order(db, str(payload.get("transaction_id") or ""))
    if order is None:
        return "ignored"
    if _signed(payload):
        return await _apply_signed(payload, order, db)
    result = await confirm_order_with_payme(order, db)
    if result == "pending":
        raise HTTPException(status_code=401, detail="חתימה לא תקינה")
    return result
