"""« צור קשר » : message envoyé à BREVO_SENDER_EMAIL, échappement HTML, limite d'envois."""

from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.config import settings
from app.schemas.contact import ContactRequest
from app.services import contact_message
from app.routers.contact import client_ip
from app.schemas.contact import PublicContactRequest
from app.services.contact_message import (
    build_html,
    build_subject,
    send_contact_message,
    send_public_contact_message,
    sender_from_user,
)
from app.services.contact_rate_limit import SlidingWindowLimiter

USER = SimpleNamespace(id=7, email="prof@example.com", full_name="דנה <b>כהן</b>", role="teacher")


def _body(**kw) -> ContactRequest:
    data = {"category": "bug", "subject": "תקלה במבחן", "message": "שלום,\nהמבחן לא נטען אצלי."}
    return ContactRequest(**{**data, **kw})


@pytest.fixture
def sent(monkeypatch):
    calls: list[dict] = []
    monkeypatch.setattr(settings, "brevo_sender_email", "contact@app.test")
    monkeypatch.setattr(contact_message, "deliver_html_email", lambda **kw: calls.append(kw) or True)
    return calls


def test_message_goes_to_sender_email_with_user_as_reply_to(sent):
    send_contact_message(USER, _body(), SlidingWindowLimiter(5, 60))
    assert sent[0]["to_email"] == "contact@app.test"
    assert sent[0]["reply_to"] == "prof@example.com"
    assert sent[0]["skip_sandbox"] is True


def test_subject_carries_category_and_is_single_line():
    subject = build_subject(_body(subject="שורה\nשנייה  כאן"))
    assert "דיווח על תקלה" in subject and "\n" not in subject


def test_user_text_is_html_escaped():
    html = build_html(sender_from_user(USER), _body(message="<script>alert(1)</script>\nשורה שנייה"))
    assert "<script>" not in html and "&lt;script&gt;" in html
    assert "<b>כהן</b>" not in html
    assert "<br/>" in html


def test_missing_recipient_returns_503(monkeypatch):
    monkeypatch.setattr(settings, "brevo_sender_email", "")
    with pytest.raises(HTTPException) as exc:
        send_contact_message(USER, _body(), SlidingWindowLimiter(5, 60))
    assert exc.value.status_code == 503


def test_delivery_failure_returns_502(monkeypatch):
    monkeypatch.setattr(settings, "brevo_sender_email", "contact@app.test")
    monkeypatch.setattr(contact_message, "deliver_html_email", lambda **_kw: False)
    with pytest.raises(HTTPException) as exc:
        send_contact_message(USER, _body(), SlidingWindowLimiter(5, 60))
    assert exc.value.status_code == 502


def test_rate_limit_blocks_after_max_and_recovers(sent):
    now = [0.0]
    limiter = SlidingWindowLimiter(2, 60, clock=lambda: now[0])
    send_contact_message(USER, _body(), limiter)
    send_contact_message(USER, _body(), limiter)
    with pytest.raises(HTTPException) as exc:
        send_contact_message(USER, _body(), limiter)
    assert exc.value.status_code == 429
    now[0] = 61.0
    send_contact_message(USER, _body(), limiter)
    assert len(sent) == 3


def test_validation_rejects_short_message():
    with pytest.raises(ValueError):
        _body(message="קצר")
