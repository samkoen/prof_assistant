from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_PROJECT_DIR = _BACKEND_DIR.parent


def _normalize_async_db_url(url: str) -> str:
    """Force le driver asyncpg (évite psycopg2 si l'URL est postgresql://)."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_BACKEND_DIR / ".env", _PROJECT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/assistant_ai"
    secret_key: str = "dev-secret-change-in-production"
    cookie_secure: bool = False
    cookie_domain: str | None = None
    frontend_url: str = "http://localhost:5173"
    resend_api_key: str = ""
    email_from: str = "noreply@assistant-ai.local"
    app_name: str = "Assistant AI"
    environment: str = "development"
    dev_auto_verify_email: bool = True

    access_token_expire_days_student: int = 7
    access_token_expire_days_staff: int = 30
    password_min_length: int = 6
    warning_minutes_default: int = 10

    @field_validator("database_url", mode="before")
    @classmethod
    def ensure_asyncpg_driver(cls, v: str) -> str:
        return _normalize_async_db_url(v)


settings = Settings()
