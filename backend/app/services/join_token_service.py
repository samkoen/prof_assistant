"""Jeton et expiration des liens / QR d'inscription."""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from app.models.course import CourseOffering

JOIN_LINK_EXPIRED_DETAIL = "קישור ההצטרפות פג תוקף — בקשו מהמורה קישור חדש"
DEFAULT_JOIN_LINK_VALID_DAYS = 30


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def generate_join_token() -> str:
    return secrets.token_urlsafe(24)


def expires_at_from_valid_days(valid_days: int) -> datetime:
    return utc_now() + timedelta(days=valid_days)


def assign_join_token(offering: CourseOffering, valid_days: int = DEFAULT_JOIN_LINK_VALID_DAYS) -> None:
    offering.join_token = generate_join_token()
    offering.join_token_expires_at = expires_at_from_valid_days(valid_days)


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def is_join_link_valid(offering: CourseOffering) -> bool:
    if not offering.join_token or not offering.join_token_expires_at:
        return False
    return utc_now() < _as_utc(offering.join_token_expires_at)


def ensure_join_link_valid(offering: CourseOffering) -> None:
    if not is_join_link_valid(offering):
        raise HTTPException(status_code=410, detail=JOIN_LINK_EXPIRED_DETAIL)
