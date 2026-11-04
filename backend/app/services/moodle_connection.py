"""Connexion Moodle d'un professeur : lecture et enregistrement du jeton chiffré."""

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.integrations.moodle.client import call_moodle
from app.integrations.moodle.crypto import MoodleTokenError, decrypt_token, encrypt_token
from app.integrations.moodle.parse import MoodleApiError, normalize_base_url, site_user_id
from app.models.moodle import MoodleConnection
from app.models.user import User
from app.schemas.moodle import MoodleConnectionStatus


async def connection_status(db: AsyncSession, teacher_id: int) -> MoodleConnectionStatus:
    row = await _row(db, teacher_id)
    if row is None:
        return MoodleConnectionStatus(connected=False)
    return _status(row)


async def save_connection(
    db: AsyncSession, teacher: User, base_url: str, token: str
) -> MoodleConnectionStatus:
    url = checked_base_url(base_url)
    secret = token.strip()
    if not secret:
        raise HTTPException(status_code=400, detail="מפתח האבטחה חסר")
    moodle_user_id = await _site_user_id(url, secret)
    row = await _upsert(db, teacher.id, url, secret, moodle_user_id)
    await db.commit()
    return _status(row)


async def require_credentials(db: AsyncSession, teacher_id: int) -> tuple[str, str, int]:
    row = await _row(db, teacher_id)
    if row is None:
        raise HTTPException(status_code=400, detail="Moodle אינו מחובר")
    try:
        token = decrypt_token(settings.secret_key, row.token_encrypted)
    except MoodleTokenError:
        raise HTTPException(status_code=400, detail="יש לחבר מחדש את Moodle") from None
    return row.base_url, token, row.moodle_user_id


def checked_base_url(raw: str) -> str:
    try:
        return normalize_base_url(raw)
    except ValueError:
        raise HTTPException(status_code=400, detail="כתובת Moodle חייבת להתחיל ב-https") from None


async def moodle_call(
    base_url: str, token: str, function: str, params: list[tuple[str, str]] | None = None
) -> object:
    try:
        return await call_moodle(base_url, token, function, params)
    except MoodleApiError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


async def _site_user_id(base_url: str, token: str) -> int:
    payload = await moodle_call(base_url, token, "core_webservice_get_site_info")
    try:
        return site_user_id(payload)
    except MoodleApiError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


async def _row(db: AsyncSession, teacher_id: int) -> MoodleConnection | None:
    return await db.scalar(
        select(MoodleConnection).where(MoodleConnection.teacher_id == teacher_id)
    )


async def _upsert(
    db: AsyncSession, teacher_id: int, url: str, token: str, moodle_user_id: int
) -> MoodleConnection:
    row = await _row(db, teacher_id)
    encrypted = encrypt_token(settings.secret_key, token)
    if row is None:
        row = MoodleConnection(
            teacher_id=teacher_id,
            base_url=url,
            token_encrypted=encrypted,
            moodle_user_id=moodle_user_id,
        )
        db.add(row)
    else:
        row.base_url = url
        row.token_encrypted = encrypted
        row.moodle_user_id = moodle_user_id
        row.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return row


def _status(row: MoodleConnection) -> MoodleConnectionStatus:
    return MoodleConnectionStatus(
        connected=True, base_url=row.base_url, moodle_user_id=row.moodle_user_id
    )
