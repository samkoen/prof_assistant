"""Année scolaire : de septembre à août."""

from datetime import date


def current_academic_year(today: date | None = None) -> int:
    today = today or date.today()
    return today.year if today.month >= 9 else today.year - 1


def clip_label(value: str, limit: int = 255) -> str:
    text = " ".join((value or "").split())
    return (text or "Moodle")[:limit]
