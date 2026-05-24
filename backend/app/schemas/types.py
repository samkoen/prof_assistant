"""Types de validation partagés."""

from typing import Annotated

from pydantic import BeforeValidator

from app.config import settings


def _normalize_email(value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("כתובת אימייל לא תקינה")
    value = value.strip().lower()
    if "@" not in value or len(value) < 5:
        raise ValueError("כתובת אימייל לא תקינה")

    if settings.environment == "development":
        # En dev : autorise admin@assistant-ai.local, etc.
        return value

    from email_validator import EmailNotValidError, validate_email

    try:
        return validate_email(value, check_deliverability=False).normalized
    except EmailNotValidError as exc:
        raise ValueError(str(exc)) from exc


AppEmail = Annotated[str, BeforeValidator(_normalize_email)]
