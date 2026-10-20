import pytest

from app.config import settings
from tests.integration.conftest import ItEnv
from tests.integration.seed import STUDENT_EMAIL, TEACHER_EMAIL


@pytest.mark.integration
async def test_guest_checkout_http_rejects_unknown_email(it_env: ItEnv):
    response = await it_env.client.post(
        "/api/billing/guest-checkout",
        json={"email": "nobody@example.com", "pack_code": "student_20"},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "האימייל לא קיים במערכת"


@pytest.mark.integration
async def test_guest_checkout_http_starts_sale_for_existing_student(it_env: ItEnv, monkeypatch):
    monkeypatch.setattr(settings, "payme_seller_id", "seller", raising=False)
    monkeypatch.setattr(settings, "payme_api_key", "key", raising=False)

    async def _sale(_body: dict) -> dict:
        return {"sale_url": "https://pay.example/sale", "payme_sale_id": "S1"}

    monkeypatch.setattr("app.services.billing.checkout.create_sale", _sale)
    response = await it_env.client.post(
        "/api/billing/guest-checkout",
        json={"email": STUDENT_EMAIL.upper(), "pack_code": "student_20"},
    )
    assert response.status_code == 200
    assert response.json()["payment_url"] == "https://pay.example/sale"


@pytest.mark.integration
async def test_guest_checkout_rejects_pack_for_the_other_role(it_env: ItEnv, monkeypatch):
    monkeypatch.setattr(settings, "payme_seller_id", "seller", raising=False)
    monkeypatch.setattr(settings, "payme_api_key", "key", raising=False)
    response = await it_env.client.post(
        "/api/billing/guest-checkout",
        json={"email": TEACHER_EMAIL, "pack_code": "student_20"},
    )
    assert response.status_code == 403
