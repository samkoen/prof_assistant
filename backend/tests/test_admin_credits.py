from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.services.billing.admin_credits import (
    MAX_ADMIN_CREDITS,
    credit_view,
    set_user_credits,
)
from app.services.billing.constants import STUDENT_AI, STUDENT_FREE_CREDITS, TEACHER_GENERATION
from app.services.billing.settings_store import default_config
from tests.integration.conftest import open_sqlite_maker


def test_admin_is_unlimited():
    view = credit_view(SimpleNamespace(role="admin"), None, default_config())
    assert view == {"credits": None, "unlimited": True, "product": None}


def test_student_without_wallet_shows_free_quota():
    view = credit_view(SimpleNamespace(role="student"), None, default_config())
    assert view["credits"] == STUDENT_FREE_CREDITS
    assert view["product"] == STUDENT_AI
    assert view["unlimited"] is False


@pytest.mark.asyncio
async def test_set_credits_rejects_non_admin():
    teacher = SimpleNamespace(id=2, role="teacher")
    student = SimpleNamespace(id=3, role="student")
    with pytest.raises(HTTPException) as exc:
        await set_user_credits(None, teacher, student, 10)
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_set_credits_rejects_admin_target(monkeypatch):
    _engine, maker = await open_sqlite_maker()
    monkeypatch.setattr("app.database.async_session_maker", maker)
    admin = SimpleNamespace(id=1, role="admin")
    async with maker() as db:
        with pytest.raises(HTTPException) as exc:
            await set_user_credits(db, admin, admin, 99)
        assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_admin_replaces_student_balance(monkeypatch):
    _engine, maker = await open_sqlite_maker()
    monkeypatch.setattr("app.database.async_session_maker", maker)
    admin = SimpleNamespace(id=1, role="admin")
    student = SimpleNamespace(id=8, role="student")
    async with maker() as db:
        result = await set_user_credits(db, admin, student, 42)
        await db.commit()
    assert result == {"user_id": 8, "credits": 42, "product": STUDENT_AI}
    from app.models.billing import AiWallet
    from sqlalchemy import select

    async with maker() as db:
        wallet = (await db.execute(select(AiWallet).where(AiWallet.user_id == 8))).scalar_one()
    assert wallet.paid_remaining == 42
    assert wallet.free_remaining == 0
    assert wallet.product == STUDENT_AI


@pytest.mark.asyncio
async def test_out_of_range_is_rejected(monkeypatch):
    _engine, maker = await open_sqlite_maker()
    admin = SimpleNamespace(id=1, role="admin")
    student = SimpleNamespace(id=9, role="student")
    async with maker() as db:
        with pytest.raises(HTTPException) as exc:
            await set_user_credits(db, admin, student, MAX_ADMIN_CREDITS + 1)
        assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_teacher_wallet_uses_generation_product(monkeypatch):
    _engine, maker = await open_sqlite_maker()
    monkeypatch.setattr("app.database.async_session_maker", maker)
    admin = SimpleNamespace(id=1, role="admin")
    teacher = SimpleNamespace(id=4, role="teacher")
    async with maker() as db:
        result = await set_user_credits(db, admin, teacher, 7)
        await db.commit()
    assert result["product"] == TEACHER_GENERATION
