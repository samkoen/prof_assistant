import pytest

from app.security import create_password_reset_token
from app.services.auth_messages import EMAIL_ALREADY_EXISTS, EMAIL_NOT_VERIFIED, RESET_TOKEN_INVALID
from tests.integration.conftest import ItEnv
from tests.integration.http_helpers import login, logout
from tests.integration.seed import PASSWORD, STUDENT_EMAIL

PENDING_EMAIL = "pending.verify@assistant-ai.local"


def _register_payload(email: str) -> dict:
    return {
        "email": email,
        "password": "secret12",
        "full_name": "Pending Student",
        "role": "student",
    }


@pytest.mark.integration
async def test_login_and_me(it_env: ItEnv):
    await login(it_env.client, STUDENT_EMAIL)
    me = await it_env.client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == STUDENT_EMAIL
    assert me.json()["role"] == "student"


@pytest.mark.integration
async def test_login_rejects_bad_password(it_env: ItEnv):
    response = await it_env.client.post(
        "/api/auth/login",
        json={"email": STUDENT_EMAIL, "password": "wrong-password"},
    )
    assert response.status_code == 401


@pytest.mark.integration
async def test_me_requires_auth(it_env: ItEnv):
    await logout(it_env.client)
    response = await it_env.client.get("/api/auth/me")
    assert response.status_code in (401, 403)


@pytest.mark.integration
async def test_register_duplicate_and_unverified_login(it_env: ItEnv):
    created = await it_env.client.post("/api/auth/register", json=_register_payload(PENDING_EMAIL))
    assert created.status_code == 200
    again = await it_env.client.post("/api/auth/register", json=_register_payload(PENDING_EMAIL))
    assert again.status_code == 400
    assert again.json()["detail"] == EMAIL_ALREADY_EXISTS
    denied = await it_env.client.post(
        "/api/auth/login",
        json={"email": PENDING_EMAIL, "password": "secret12"},
    )
    assert denied.status_code == 403
    assert denied.json()["detail"] == EMAIL_NOT_VERIFIED


@pytest.mark.integration
async def test_resend_verification_always_ok(it_env: ItEnv, monkeypatch):
    sent: list[str] = []

    async def capture(email: str, _user_id: int, _name: str) -> bool:
        sent.append(email)
        return True

    monkeypatch.setattr("app.services.email.send_verification_email", capture)
    await it_env.client.post("/api/auth/register", json=_register_payload(PENDING_EMAIL))
    sent.clear()
    unknown = await it_env.client.post(
        "/api/auth/resend-verification",
        json={"email": "nobody@assistant-ai.local"},
    )
    pending = await it_env.client.post(
        "/api/auth/resend-verification",
        json={"email": PENDING_EMAIL},
    )
    verified = await it_env.client.post(
        "/api/auth/resend-verification",
        json={"email": STUDENT_EMAIL},
    )
    assert unknown.status_code == pending.status_code == verified.status_code == 200
    assert sent == [PENDING_EMAIL]


def _capture_reset(monkeypatch) -> list[int]:
    captured: list[int] = []

    async def capture(_email: str, user_id: int, _name: str) -> bool:
        captured.append(user_id)
        return True

    monkeypatch.setattr(
        "app.services.password_reset.email_service.send_password_reset_email",
        capture,
    )
    return captured


@pytest.mark.integration
async def test_forgot_password_then_login_with_new_password(it_env: ItEnv, monkeypatch):
    captured = _capture_reset(monkeypatch)
    unknown = await it_env.client.post(
        "/api/auth/forgot-password",
        json={"email": "nobody@assistant-ai.local"},
    )
    assert unknown.status_code == 200
    assert captured == []
    asked = await it_env.client.post(
        "/api/auth/forgot-password",
        json={"email": STUDENT_EMAIL},
    )
    assert asked.status_code == 200
    assert len(captured) == 1
    reset = await it_env.client.post(
        "/api/auth/reset-password",
        json={"token": create_password_reset_token(captured[0]), "new_password": "new-secret"},
    )
    assert reset.status_code == 200
    old = await it_env.client.post(
        "/api/auth/login",
        json={"email": STUDENT_EMAIL, "password": PASSWORD},
    )
    assert old.status_code == 401
    fresh = await it_env.client.post(
        "/api/auth/login",
        json={"email": STUDENT_EMAIL, "password": "new-secret"},
    )
    assert fresh.status_code == 200


@pytest.mark.integration
async def test_reset_password_rejects_bad_token_and_short_password(it_env: ItEnv):
    bad = await it_env.client.post(
        "/api/auth/reset-password",
        json={"token": "not-a-valid-token-value", "new_password": "new-secret"},
    )
    assert bad.status_code == 400
    assert bad.json()["detail"] == RESET_TOKEN_INVALID
    short = await it_env.client.post(
        "/api/auth/reset-password",
        json={"token": "0123456789abc", "new_password": "12345"},
    )
    assert short.status_code == 422


@pytest.mark.integration
async def test_reset_unlocks_unverified_account(it_env: ItEnv, monkeypatch):
    captured = _capture_reset(monkeypatch)
    created = await it_env.client.post("/api/auth/register", json=_register_payload(PENDING_EMAIL))
    assert created.status_code == 200
    asked = await it_env.client.post(
        "/api/auth/forgot-password",
        json={"email": PENDING_EMAIL},
    )
    assert asked.status_code == 200
    reset = await it_env.client.post(
        "/api/auth/reset-password",
        json={"token": create_password_reset_token(captured[0]), "new_password": "new-secret"},
    )
    assert reset.status_code == 200
    fresh = await it_env.client.post(
        "/api/auth/login",
        json={"email": PENDING_EMAIL, "password": "new-secret"},
    )
    assert fresh.status_code == 200
