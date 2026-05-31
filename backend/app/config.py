import os
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_PROJECT_DIR = _BACKEND_DIR.parent

_ASYNCPG_STRIP_QUERY = frozenset({"sslmode", "channel_binding"})
_SSL_REQUIRED_MODES = frozenset({"require", "verify-ca", "verify-full", "prefer"})


def _normalize_asyncpg_driver(url: str) -> str:
    """Force le driver asyncpg (évite psycopg2 si l'URL est postgresql://)."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


def prepare_database_url(raw: str) -> tuple[str, bool]:
    """Nettoie l'URL pour asyncpg ; sslmode → connect_args ssl (Neon, etc.)."""
    url = _normalize_asyncpg_driver(raw.strip())
    parsed = urlparse(url)
    qs = parse_qs(parsed.query, keep_blank_values=True)

    ssl_required = False
    if "sslmode" in qs:
        mode = (qs["sslmode"][0] or "").lower()
        ssl_required = mode in _SSL_REQUIRED_MODES

    host = (parsed.hostname or "").lower()
    if not ssl_required and host.endswith(".neon.tech"):
        ssl_required = True

    for key in _ASYNCPG_STRIP_QUERY:
        qs.pop(key, None)

    flat_qs = {k: v[0] if len(v) == 1 else v for k, v in qs.items()}
    query = urlencode(flat_qs) if flat_qs else ""
    cleaned = urlunparse(parsed._replace(query=query))
    return cleaned, ssl_required


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_BACKEND_DIR / ".env", _PROJECT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/assistant_ai"
    database_ssl: bool = False
    secret_key: str = "dev-secret-change-in-production"
    cookie_secure: bool = False
    cookie_domain: str | None = None
    frontend_url: str = "http://localhost:5173"
    app_name: str = "Assistant AI"
    environment: str = "development"

    brevo_api_key: str = ""
    brevo_sender_email: str = ""
    brevo_sender_name: str = ""
    brevo_use_simulation: bool = True
    brevo_sandbox_recipient: str = ""
    email_verify_expire_hours: int = 48

    access_token_expire_days_student: int = 7
    access_token_expire_days_staff: int = 30
    password_min_length: int = 6
    warning_minutes_default: int = 10

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    gemini_temperature: float = 0.3
    gemini_max_output_tokens: int = 2048
    gemini_generation_max_output_tokens: int = 8192
    gemini_thinking_budget: int = 0
    gemini_timeout_seconds: float = 45.0
    gemini_generation_timeout_seconds: float = 120.0
    gemini_fallback_models: str = "gemini-2.0-flash,gemini-2.5-flash-lite"
    gemini_generation_fallback_models: str = "gemini-2.0-flash,gemini-2.5-flash-lite"
    gemini_retry_count: int = 2
    gemini_retry_delay_seconds: float = 2.0

    gemini_sources_dir: str = "data/gemini_sources"
    gemini_source_max_file_bytes: int = 15 * 1024 * 1024
    gemini_source_max_chars_per_file: int = 80_000
    gemini_source_max_total_chars: int = 120_000
    gemini_source_max_files_per_exam: int = 5

    @model_validator(mode="after")
    def apply_vercel_storage_defaults(self) -> "Settings":
        """Vercel serverless : FS éphémère, seul /tmp est inscriptible."""
        if os.getenv("VERCEL") and self.gemini_sources_dir == "data/gemini_sources":
            object.__setattr__(self, "gemini_sources_dir", "/tmp/gemini_sources")
        return self

    @model_validator(mode="before")
    @classmethod
    def normalize_database_connection(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        raw = data.get("database_url")
        if raw is None:
            return data
        url, ssl = prepare_database_url(str(raw))
        data["database_url"] = url
        data["database_ssl"] = ssl
        return data


settings = Settings()
