"""Service e-mail — inscription (vérification) via Brevo."""

from __future__ import annotations

import logging

from app.config import settings
from app.security import create_email_verification_token
from app.services.email_delivery import deliver_html_email
from app.services.email_templates import verification_email_html

logger = logging.getLogger(__name__)


def build_verification_url(user_id: int) -> str:
    token = create_email_verification_token(user_id)
    base = settings.frontend_url.rstrip("/")
    return f"{base}/verify-email?token={token}"


async def send_verification_email(email: str, user_id: int, full_name: str) -> bool:
    verify_url = build_verification_url(user_id)
    subject = f"{settings.app_name} — אימות אימייל"
    html = verification_email_html(
        app_name=settings.app_name,
        full_name=full_name,
        verify_url=verify_url,
    )
    ok = deliver_html_email(to_email=email, subject=subject, html_content=html, kind="register_verify")
    if not ok:
        logger.warning("Échec envoi e-mail vérification pour user_id=%s", user_id)
    return ok
