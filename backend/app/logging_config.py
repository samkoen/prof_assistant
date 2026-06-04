"""Configuration centralisée du logging (niveau app + requêtes SQL)."""

from __future__ import annotations

import logging
import sys

from app.config import settings

_VALID_LEVELS = frozenset({"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"})


def resolve_log_level(name: str) -> int:
    key = (name or "INFO").strip().upper()
    if key not in _VALID_LEVELS:
        key = "INFO"
    return getattr(logging, key)


def configure_logging() -> None:
    level = resolve_log_level(settings.log_level)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        stream=sys.stdout,
        force=True,
    )
    logging.getLogger("app").setLevel(level)

    sql_level = logging.INFO if settings.sql_echo else logging.WARNING
    logging.getLogger("sqlalchemy.engine").setLevel(sql_level)
    logging.getLogger("sqlalchemy.engine.Engine").setLevel(sql_level)
