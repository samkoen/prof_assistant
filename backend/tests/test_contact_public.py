"""« צור קשר » public : visiteur anonyme, piège à robots, limites par IP et globale."""

from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.config import settings
from app.routers.contact import client_ip
from app.schemas.contact import PublicContactRequest
from app.services import contact_message
from app.services.contact_message import send_public_contact_message
from app.services.contact_rate_limit import SlidingWindowLimiter


def _public(**kw) -> PublicContactRequest:
    data = {
        "category": "question",
        "subject": "לא מצליח להתחבר",
        "message": "שכחתי את הסיסמה ואין לי גישה לאימייל.",
        "name": "יוסי לוי",
        "email": "yossi@example.com",
    }
    return PublicContactRequest(**{**data, **kw})


def _send(body, ip="1.1.1.1", per_ip=3, global_max=30, limiters=None):
    ip_limiter, global_limiter = limiters or (SlidingWindowLimiter(per_ip, 60), SlidingWindowLimiter(global_max, 60))
    send_public_contact_message(body, ip, ip_limiter, global_limiter)


@pytest.fixture
def sent(monkeypatch):
    calls: list[dict] = []
    monkeypatch.setattr(settings, "brevo_sender_email", "contact@app.test")
    monkeypatch.setattr(contact_message, "deliver_html_email", lambda **kw: calls.append(kw) or True)
    return calls


def test_visitor_email_is_reply_to(sent):
    _send(_public())
    assert sent[0]["to_email"] == "contact@app.test"
    assert sent[0]["reply_to"] == "yossi@example.com"
    assert "מבקר" in sent[0]["html_content"] and "יוסי לוי" in sent[0]["html_content"]


def test_honeypot_is_silently_ignored(sent):
    _send(_public(website="http://spam.test"))
    assert sent == []


def test_ip_limit_is_per_ip(sent):
    limiters = (SlidingWindowLimiter(2, 60), SlidingWindowLimiter(10, 60))
    _send(_public(), "1.1.1.1", limiters=limiters)
    _send(_public(), "1.1.1.1", limiters=limiters)
    with pytest.raises(HTTPException) as exc:
        _send(_public(), "1.1.1.1", limiters=limiters)
    assert exc.value.status_code == 429
    _send(_public(), "2.2.2.2", limiters=limiters)
    assert len(sent) == 3


def test_global_limit_caps_spoofed_ips(sent):
    limiters = (SlidingWindowLimiter(5, 60), SlidingWindowLimiter(2, 60))
    _send(_public(), "1.1.1.1", limiters=limiters)
    _send(_public(), "2.2.2.2", limiters=limiters)
    with pytest.raises(HTTPException) as exc:
        _send(_public(), "3.3.3.3", limiters=limiters)
    assert exc.value.status_code == 429


def test_email_must_be_valid():
    with pytest.raises(ValueError):
        _public(email="pas-un-email")


def test_client_ip_prefers_forwarded_header():
    forwarded = SimpleNamespace(headers={"x-forwarded-for": "9.9.9.9, 10.0.0.1"}, client=SimpleNamespace(host="10.0.0.1"))
    direct = SimpleNamespace(headers={}, client=SimpleNamespace(host="5.6.7.8"))
    assert client_ip(forwarded) == "9.9.9.9"
    assert client_ip(direct) == "5.6.7.8"
