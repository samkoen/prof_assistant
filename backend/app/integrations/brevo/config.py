"""Configuration Brevo — variables d'environnement via Settings."""

from __future__ import annotations

from app.config import settings

_DEFAULT_SANDBOX_RECIPIENT = ""


def brevo_api_key() -> str | None:
    v = (settings.brevo_api_key or "").strip()
    return v or None


def brevo_sender_email() -> str | None:
    v = (settings.brevo_sender_email or "").strip()
    return v or None


def brevo_sender_name() -> str:
    v = (settings.brevo_sender_name or "").strip()
    return v or settings.app_name


def brevo_force_simulation() -> bool:
    return settings.brevo_use_simulation


def brevo_credentials_ok() -> bool:
    return bool(brevo_api_key() and brevo_sender_email())


def brevo_sandbox_recipient() -> str:
    v = (settings.brevo_sandbox_recipient or "").strip()
    return v if v else _DEFAULT_SANDBOX_RECIPIENT


def brevo_is_configured() -> bool:
    return brevo_credentials_ok() and not brevo_force_simulation()
