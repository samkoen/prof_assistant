"""Livraison d'e-mails (Brevo ou simulation / logs en dev)."""

from __future__ import annotations

import logging

from app.integrations.brevo import BrevoApiError, brevo_credentials_ok, send_transactional_html_email
from app.integrations.brevo.config import brevo_force_simulation, brevo_sandbox_recipient

logger = logging.getLogger(__name__)


def _resolve_recipient(to_email: str) -> tuple[str, str, bool]:
    orig = (to_email or "").strip()
    sandbox = brevo_force_simulation()
    if sandbox:
        recipient = brevo_sandbox_recipient().strip() or orig
        return orig, recipient, True
    return orig, orig, False


def deliver_html_email(
    *,
    to_email: str,
    subject: str,
    html_content: str,
    kind: str,
) -> bool:
    orig_to, recipient, sandbox = _resolve_recipient(to_email)
    if not orig_to:
        logger.error("[email:%s] Destinataire vide", kind)
        return False

    if sandbox and not brevo_sandbox_recipient().strip():
        return _log_simulation(orig_to, orig_to, True, subject, html_content, kind)

    if not recipient:
        logger.error("[email:%s] Sandbox sans destinataire", kind)
        return False

    if brevo_credentials_ok():
        return _send_via_brevo(orig_to, recipient, sandbox, subject, html_content, kind)

    return _log_simulation(orig_to, recipient, sandbox, subject, html_content, kind)


def _send_via_brevo(
    orig_to: str,
    recipient: str,
    sandbox: bool,
    subject: str,
    html_content: str,
    kind: str,
) -> bool:
    try:
        resp = send_transactional_html_email(
            to_email=recipient,
            subject=subject,
            html_content=html_content,
        )
        mid = resp.get("messageId") or resp.get("message_id") if isinstance(resp, dict) else None
        mode = "Brevo sandbox" if sandbox else "Brevo"
        extra = f" (demande: {orig_to})" if sandbox and orig_to.lower() != recipient.lower() else ""
        print(f"\n--- E-mail {mode} ({kind}) → {recipient}{extra} | ID: {mid or '—'}\n")
        logger.info("[email:brevo %s] %s -> %s sandbox=%s", kind, orig_to, recipient, sandbox)
        return True
    except BrevoApiError as e:
        logger.error("[email:brevo] Échec %s (%s): %s", kind, orig_to, e)
        return False


def _log_simulation(
    orig_to: str,
    recipient: str,
    sandbox: bool,
    subject: str,
    html_content: str,
    kind: str,
) -> bool:
    excerpt = html_content[:800] + (" …" if len(html_content) > 800 else "")
    label = "Simulation sandbox" if sandbox else "Simulation — Brevo non configuré"
    note = f"\n  (demande app: {orig_to})\n" if sandbox and orig_to != recipient else ""
    print(
        f"\n--- {label} ({kind}) — pas d'API Brevo ---{note}"
        f"  Destinataire : {recipient}\n  Objet : {subject}\n  HTML :\n{excerpt}\n---\n"
    )
    logger.info("[email:simulation %s] %s -> %s", kind, orig_to, recipient)
    return True
