from types import SimpleNamespace
from urllib.error import URLError

import pytest

from app.integrations.brevo import client as brevo_client
from app.integrations.brevo.client import BrevoApiError
from app.services import auth_verification as av
from app.services.auth_verification import ResendOutcome

PENDING = SimpleNamespace(
    id=7, email="ada@school.test", full_name="Ada", is_blocked=False,
    email_verified=False, email_verified_by_teacher=False,
)


def _stub_user(monkeypatch, user):
    async def fake_find(_db, _email):
        return user

    monkeypatch.setattr(av, "find_user_by_email", fake_find)


def _stub_send(monkeypatch, result: bool):
    async def fake_send(_email, _uid, _name):
        return result

    monkeypatch.setattr(av.email_service, "send_verification_email", fake_send)


@pytest.mark.asyncio
async def test_resend_reports_sent(monkeypatch):
    _stub_user(monkeypatch, PENDING)
    _stub_send(monkeypatch, True)
    assert await av.resend_verification_for_email(None, "ada@school.test") == ResendOutcome.SENT


@pytest.mark.asyncio
async def test_resend_reports_delivery_failure(monkeypatch):
    _stub_user(monkeypatch, PENDING)
    _stub_send(monkeypatch, False)
    outcome = await av.resend_verification_for_email(None, "ada@school.test")
    assert outcome == ResendOutcome.DELIVERY_FAILED


@pytest.mark.asyncio
async def test_resend_ignores_unknown_or_verified(monkeypatch):
    _stub_send(monkeypatch, True)
    _stub_user(monkeypatch, None)
    assert await av.resend_verification_for_email(None, "x@y.z") == ResendOutcome.NOT_ELIGIBLE
    _stub_user(monkeypatch, SimpleNamespace(**{**PENDING.__dict__, "email_verified": True}))
    assert await av.resend_verification_for_email(None, "x@y.z") == ResendOutcome.NOT_ELIGIBLE


def test_network_error_becomes_brevo_error(monkeypatch):
    monkeypatch.setattr(brevo_client, "brevo_api_key", lambda: "key")
    monkeypatch.setattr(brevo_client, "brevo_sender_email", lambda: "a@b.c")

    def boom(*_a, **_kw):
        raise URLError("dns")

    monkeypatch.setattr(brevo_client, "_open", boom)
    with pytest.raises(BrevoApiError):
        brevo_client.send_transactional_html_email(to_email="x@y.z", subject="s", html_content="<p/>")
