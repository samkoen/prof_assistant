"""Webhook de remboursement, réservation de la חבילה avant PayMe et clôture de compte."""

from datetime import datetime, timedelta, timezone

import httpx
import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.config import settings
from app.models.billing import AiWallet, PaymentOrder
from app.models.user import User
from app.services.billing.account_closure import REFUND_BEFORE_CLOSE, close_account, refund_unused_pack
from app.services.billing.checkout import apply_webhook
from app.services.billing.constants import ORDER_PAID, ORDER_REFUNDED, STUDENT_AI, STUDENT_FREE_CREDITS
from app.services.billing.payme import payme_signature
from app.services.billing.payme_client import refund_sale
from tests.integration.conftest import open_sqlite_maker

NOW = datetime.now(timezone.utc)


@pytest.fixture
async def maker(monkeypatch):
    engine, session_maker = await open_sqlite_maker()
    monkeypatch.setattr(settings, "payme_webhook_secret", "sek", raising=False)
    yield session_maker
    await engine.dispose()  # sinon le thread aiosqlite empêche pytest de se terminer


def _signed(status: str) -> dict:
    payload = {"transaction_id": "txn-once", "payme_sale_id": "SALE1", "sale_status": status, "price": "1900"}
    payload["payme_signature"] = payme_signature("sek", "txn-once", "SALE1", status)
    return payload


async def _paid_order(maker) -> None:
    async with maker() as db:
        db.add(
            PaymentOrder(
                user_id=9,
                pack_code="student_20",
                product=STUDENT_AI,
                credits=20,
                amount_agorot=1900,
                status="pending",
                transaction_id="txn-once",
            )
        )
        await db.commit()
        assert await apply_webhook(_signed("completed"), db) == "paid"


async def _add_student(db) -> None:
    db.add(User(id=9, email="s@x.il", full_name="S", password_hash="h", role="student"))


async def _wallet(db) -> AiWallet:
    return (await db.execute(select(AiWallet).where(AiWallet.user_id == 9))).scalar_one()


@pytest.mark.asyncio
async def test_refund_webhook_removes_credits_from_a_paid_order(maker):
    await _paid_order(maker)
    async with maker() as db:
        assert await apply_webhook(_signed("refunded"), db) == "refunded"
        order = (await db.execute(select(PaymentOrder))).scalar_one()
        wallet = await _wallet(db)
    assert order.status == ORDER_REFUNDED
    assert order.credits_remaining == 0
    assert wallet.paid_remaining == 0
    assert wallet.free_remaining == STUDENT_FREE_CREDITS


@pytest.mark.asyncio
async def test_completed_webhook_does_not_recredit_a_refunded_order(maker):
    await _paid_order(maker)
    async with maker() as db:
        await apply_webhook(_signed("refunded"), db)
        assert await apply_webhook(_signed("completed"), db) == "refunded"
        wallet = await _wallet(db)
    assert wallet.paid_remaining == 0


@pytest.mark.asyncio
async def test_pack_is_reserved_before_payme_and_restored_if_payme_fails(maker, monkeypatch):
    await _paid_order(maker)
    seen: dict[str, int | None] = {}

    async with maker() as db:
        async def fail_refund(_sale_id: str) -> None:
            current = (await db.execute(select(PaymentOrder))).scalar_one()
            seen["remaining"] = current.credits_remaining
            seen["paid"] = (await _wallet(db)).paid_remaining
            raise HTTPException(status_code=502, detail="PayMe")

        monkeypatch.setattr("app.services.billing.account_closure.refund_sale", fail_refund)
        monkeypatch.setattr("app.services.billing.account_closure.fetch_sale", lambda _txn: _none())
        order = (await db.execute(select(PaymentOrder))).scalar_one()
        order.paid_at = NOW - timedelta(days=1)
        await db.commit()
        with pytest.raises(HTTPException):
            await refund_unused_pack(db, order)
        await db.commit()
        stored = (await db.execute(select(PaymentOrder))).scalar_one()
        wallet = await _wallet(db)
    assert seen == {"remaining": 0, "paid": 0}
    assert stored.status == ORDER_PAID
    assert stored.credits_remaining == 20
    assert wallet.paid_remaining == 20


@pytest.mark.asyncio
async def test_refund_marks_order_refunded_when_payme_accepts(maker, monkeypatch):
    await _paid_order(maker)
    calls: list[str] = []

    async def ok_refund(sale_id: str) -> dict:
        calls.append(sale_id)
        return {"status_code": 0}

    monkeypatch.setattr("app.services.billing.account_closure.refund_sale", ok_refund)
    async with maker() as db:
        order = (await db.execute(select(PaymentOrder))).scalar_one()
        order.paid_at = NOW - timedelta(days=13)
        await db.commit()
        await refund_unused_pack(db, order)
        await db.commit()
        stored = (await db.execute(select(PaymentOrder))).scalar_one()
        wallet = await _wallet(db)
    assert calls == ["SALE1"]
    assert (stored.status, stored.credits_remaining) == (ORDER_REFUNDED, 0)
    assert wallet.paid_remaining == 0


@pytest.mark.asyncio
async def test_refund_refused_after_fourteen_days_without_touching_payme(maker, monkeypatch):
    await _paid_order(maker)

    async def unexpected(_sale_id: str) -> dict:
        raise AssertionError("PayMe ne doit pas être appelé")

    monkeypatch.setattr("app.services.billing.account_closure.refund_sale", unexpected)
    async with maker() as db:
        order = (await db.execute(select(PaymentOrder))).scalar_one()
        order.paid_at = NOW - timedelta(days=15)
        await db.commit()
        with pytest.raises(HTTPException) as excinfo:
            await refund_unused_pack(db, order)
        wallet = await _wallet(db)
    assert excinfo.value.status_code == 400
    assert wallet.paid_remaining == 20


@pytest.mark.asyncio
async def test_refund_rereads_the_order_under_lock(maker, monkeypatch):
    """Un crédit consommé par une autre session après le chargement de la commande bloque le remboursement."""
    await _paid_order(maker)

    async def unexpected(_sale_id: str) -> dict:
        raise AssertionError("PayMe ne doit pas être appelé")

    monkeypatch.setattr("app.services.billing.account_closure.refund_sale", unexpected)
    async with maker() as db:
        order = (await db.execute(select(PaymentOrder))).scalar_one()
        order.paid_at = NOW - timedelta(days=1)
        await db.commit()
        async with maker() as other:
            concurrent = (await other.execute(select(PaymentOrder))).scalar_one()
            concurrent.credits_remaining = 19
            await other.commit()
        assert order.credits_remaining == 20  # valeur périmée en identity map
        with pytest.raises(HTTPException) as excinfo:
            await refund_unused_pack(db, order)
    assert excinfo.value.status_code == 400


@pytest.mark.asyncio
async def test_external_refund_of_a_legacy_pack_drops_the_whole_pack(maker):
    """Commande d'avant le suivi (credits_remaining NULL) : l'argent est rendu, les crédits partent."""
    await _paid_order(maker)
    async with maker() as db:
        order = (await db.execute(select(PaymentOrder))).scalar_one()
        order.credits_remaining = None
        await db.commit()
        assert await apply_webhook(_signed("refunded"), db) == "refunded"
        wallet = await _wallet(db)
    assert wallet.paid_remaining == 0


@pytest.mark.asyncio
async def test_close_account_refuses_while_a_pack_is_refundable(maker):
    await _paid_order(maker)
    async with maker() as db:
        await _add_student(db)
        order = (await db.execute(select(PaymentOrder))).scalar_one()
        order.paid_at = NOW - timedelta(days=1)
        await db.commit()
        with pytest.raises(HTTPException) as excinfo:
            await close_account(db, await db.get(User, 9))
    assert excinfo.value.detail == REFUND_BEFORE_CLOSE


@pytest.mark.asyncio
async def test_close_account_blocks_and_voids_everything(maker):
    await _paid_order(maker)
    async with maker() as db:
        await _add_student(db)
        order = (await db.execute(select(PaymentOrder))).scalar_one()
        order.credits_remaining = 19  # une partie utilisée : plus remboursable
        await db.commit()
        await close_account(db, await db.get(User, 9))
        await db.commit()
        target = await db.get(User, 9)
        stored = (await db.execute(select(PaymentOrder))).scalar_one()
        wallet = await _wallet(db)
    assert target.is_blocked is True
    assert (wallet.free_remaining, wallet.paid_remaining) == (0, 0)
    assert (stored.status, stored.credits_remaining) == (ORDER_PAID, 0)


@pytest.mark.asyncio
async def test_refund_sale_network_error_becomes_http_exception(monkeypatch):
    """Un timeout PayMe doit rester une HTTPException pour que la réservation soit annulée."""
    monkeypatch.setattr(settings, "payme_seller_id", "seller", raising=False)
    monkeypatch.setattr(settings, "payme_api_key", "key", raising=False)
    monkeypatch.setattr("app.services.billing.payme_client.payme_ready", lambda: True)

    async def timeout(self, *_args, **_kwargs):
        raise httpx.ReadTimeout("slow")

    monkeypatch.setattr(httpx.AsyncClient, "post", timeout)
    with pytest.raises(HTTPException) as excinfo:
        await refund_sale("SALE1")
    assert excinfo.value.status_code == 502


async def _none():
    return None
