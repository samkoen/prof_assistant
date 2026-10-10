"""« צור קשר » : le message est envoyé à BREVO_SENDER_EMAIL (reply-to = l'expéditeur)."""

from __future__ import annotations

import html
import logging
from dataclasses import dataclass

from fastapi import HTTPException

from app.config import settings
from app.models.user import User
from app.schemas.contact import ContactRequest, PublicContactRequest
from app.services.billing.context import role_name
from app.services.contact_rate_limit import (
    SlidingWindowLimiter,
    contact_limiter,
    public_global_limiter,
    public_ip_limiter,
)
from app.services.email_delivery import deliver_html_email

logger = logging.getLogger(__name__)

CATEGORY_LABELS = {
    "question": "שאלה",
    "bug": "דיווח על תקלה",
    "billing": "קרדיטים ותשלום",
    "suggestion": "הצעה לשיפור",
    "other": "אחר",
}
ROLE_LABELS = {"admin": "מנהל", "teacher": "מורה", "student": "תלמיד"}
VISITOR_LABEL = "מבקר (לא מחובר)"


@dataclass(frozen=True)
class ContactSender:
    name: str
    email: str
    role_label: str


def sender_from_user(user: User) -> ContactSender:
    role = role_name(user)
    return ContactSender(user.full_name or "—", user.email, ROLE_LABELS.get(role, role))


def sender_from_visitor(body: PublicContactRequest) -> ContactSender:
    return ContactSender(one_line(body.name), body.email, VISITOR_LABEL)


def contact_recipient() -> str:
    return (settings.brevo_sender_email or "").strip()


def one_line(text: str) -> str:
    return " ".join((text or "").split())


def build_subject(body: ContactRequest) -> str:
    label = CATEGORY_LABELS[body.category]
    return f"[{settings.app_name}] צור קשר — {label} — {one_line(body.subject)}"[:200]


def _row(label: str, value: str, *, ltr: bool = False) -> str:
    direction = "ltr" if ltr else "rtl"
    return (
        f'<p style="margin:0 0 6px;"><strong>{html.escape(label)}:</strong> '
        f'<span dir="{direction}">{html.escape(value)}</span></p>'
    )


def build_html(sender: ContactSender, body: ContactRequest) -> str:
    rows = [
        _row("שם", sender.name),
        _row("אימייל", sender.email, ltr=True),
        _row("תפקיד", sender.role_label),
        _row("נושא הפנייה", CATEGORY_LABELS[body.category]),
        _row("כותרת", one_line(body.subject)),
    ]
    message = html.escape(body.message).replace("\n", "<br/>")
    return (
        '<html dir="rtl" lang="he"><body style="font-family:\'Segoe UI\',Arial,sans-serif;'
        'font-size:15px;color:#1a1a1a;direction:rtl;text-align:right;padding:16px;">'
        f'<h2 style="margin:0 0 12px;">{html.escape(settings.app_name)} — פנייה חדשה</h2>'
        f'{"".join(rows)}<hr style="border:0;border-top:1px solid #ddd;margin:14px 0;"/>'
        f'<div style="line-height:1.6;">{message}</div></body></html>'
    )


def _deliver(sender: ContactSender, body: ContactRequest) -> None:
    recipient = contact_recipient()
    if not recipient:
        logger.warning("Contact message skipped: BREVO_SENDER_EMAIL empty")
        raise HTTPException(status_code=503, detail="שירות יצירת הקשר אינו זמין כרגע")
    sent = deliver_html_email(
        to_email=recipient,
        subject=build_subject(body),
        html_content=build_html(sender, body),
        kind="contact",
        skip_sandbox=True,
        reply_to=sender.email,
    )
    if not sent:
        raise HTTPException(status_code=502, detail="שליחת ההודעה נכשלה. נסו שוב מאוחר יותר")


def _too_many() -> HTTPException:
    return HTTPException(status_code=429, detail="נשלחו יותר מדי פניות. נסו שוב מאוחר יותר")


def send_contact_message(
    user: User, body: ContactRequest, limiter: SlidingWindowLimiter = contact_limiter
) -> None:
    if not limiter.allow(user.id):
        raise _too_many()
    _deliver(sender_from_user(user), body)
    logger.info("Contact message sent (user_id=%s, category=%s)", user.id, body.category)


def send_public_contact_message(
    body: PublicContactRequest,
    client_ip: str,
    ip_limiter: SlidingWindowLimiter = public_ip_limiter,
    global_limiter: SlidingWindowLimiter = public_global_limiter,
) -> None:
    """Visiteur anonyme. Le champ piège rempli = robot : succès silencieux, rien n'est envoyé."""
    if body.website.strip():
        logger.info("Public contact ignored (honeypot filled, ip=%s)", client_ip)
        return
    if not ip_limiter.allow(client_ip) or not global_limiter.allow("global"):
        raise _too_many()
    _deliver(sender_from_visitor(body), body)
    logger.info("Public contact message sent (ip=%s, category=%s)", client_ip, body.category)
