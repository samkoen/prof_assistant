"""Alertes e-mail internes pour erreurs de parsing Gemini."""

from __future__ import annotations

import logging

from app.config import settings
from app.models.exam_gemini_generation import ExamGeminiGenerationMessage
from app.services.email_delivery import deliver_html_email
from app.services.email_templates import gemini_parse_error_email_html

logger = logging.getLogger(__name__)


def last_user_prompt_before_model(messages: list[ExamGeminiGenerationMessage]) -> str:
    msgs = list(messages)
    for i in range(len(msgs) - 1, -1, -1):
        if msgs[i].role != "model":
            continue
        for j in range(i - 1, -1, -1):
            if msgs[j].role == "user":
                return msgs[j].content
    for msg in msgs:
        if msg.role == "user":
            return msg.content
    return ""


def format_parse_errors(errors: list[dict]) -> list[str]:
    out: list[str] = []
    for err in errors:
        block = err.get("block", 0)
        msg = str(err.get("message", ""))
        label = f"Block {block}" if block > 0 else "General"
        out.append(f"{label}: {msg}")
    return out


def send_gemini_parse_error_email(
    *,
    exam_id: int,
    session_id: int,
    teacher_label: str,
    errors: list[dict],
    prompt: str,
    raw_text: str,
) -> bool:
    recipient = (settings.brevo_sender_email or "").strip()
    if not recipient:
        logger.warning("Gemini debug email skipped: BREVO_SENDER_EMAIL empty")
        return False

    subject = f"[{settings.app_name}] Gemini parse error — exam {exam_id}"
    html = gemini_parse_error_email_html(
        app_name=settings.app_name,
        exam_id=exam_id,
        session_id=session_id,
        teacher_label=teacher_label,
        errors=format_parse_errors(errors),
        prompt=prompt,
        raw_text=raw_text,
    )
    ok = deliver_html_email(
        to_email=recipient,
        subject=subject,
        html_content=html,
        kind="gemini_parse_debug",
        skip_sandbox=True,
    )
    if ok:
        logger.info("Gemini parse debug email sent to %s (session=%s)", recipient, session_id)
    return ok
