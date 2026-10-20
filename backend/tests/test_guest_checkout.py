"""Achat public : email inconnu refusé, compte existant crédité après PayMe."""

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.config import settings
from app.models.billing import AiWallet, PaymentOrder
from app.models.enums import UserRole
from app.models.user import User
from app.services.billing.checkout import apply_webhook
from app.services.billing.constants import STUDENT_AI
from app.services.billing.guest_checkout import UNKNOWN_BUYER, start_guest_checkout
from app.services.billing.payme import payme_signature
from tests.test_ai_billing import _bind


def _enable_payme(monkeypatch) -> None:
    monkeypatch.setattr(settings, "payme_seller_id", "seller", raising=False)
    monkeypatch.setattr(settings, "payme_api_key", "key", raising=False)
    monkeypatch.setattr(settings, "payme_webhook_secret", "sek", raising=False)


async def _sale(_body: dict) -> dict:
    return {"sale_url": "https://pay.example/sale", "payme_sale_id": "S1"}


@pytest.mark.asyncio
async def test_unknown_email_does_not_open_a_sale(monkeypatch):
    maker = await _bind(monkeypatch)
    _enable_payme(monkeypatch)
    async with maker() as db:
        with pytest.raises(HTTPException) as exc:
            await start_guest_checkout("missing@example.com", "student_20", db)
        orders = (await db.execute(select(PaymentOrder))).scalars().all()
    assert exc.value.status_code == 404
    assert exc.value.detail == UNKNOWN_BUYER
    assert orders == []


@pytest.mark.asyncio
async def test_known_email_is_credited_after_payment(monkeypatch):
    maker = await _bind(monkeypatch)
    _enable_payme(monkeypatch)
    monkeypatch.setattr("app.services.billing.checkout.create_sale", _sale)
    async with maker() as db:
        db.add(User(email="buyer@example.com", password_hash="x", full_name="Buyer", role=UserRole.STUDENT))
        await db.commit()
        order, url = await start_guest_checkout("  Buyer@Example.com ", "student_20", db)
        payload = {
            "transaction_id": order.transaction_id,
            "payme_sale_id": "S1",
            "sale_status": "completed",
            "price": "1900",
        }
        payload["payme_signature"] = payme_signature("sek", order.transaction_id, "S1", "completed")
        assert url == "https://pay.example/sale"
        assert await apply_webhook(payload, db) == "paid"
        wallet = (await db.execute(select(AiWallet).where(AiWallet.product == STUDENT_AI))).scalar_one()
    assert wallet.paid_remaining == 20
