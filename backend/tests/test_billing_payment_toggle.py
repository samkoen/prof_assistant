from types import SimpleNamespace

import pytest
from sqlalchemy import select

from app.models.billing import AiUsage, AiWallet
from app.services.ai_client import generate_text
from app.services.billing.constants import STUDENT_AI, STUDENT_FREE_CREDITS, TEACHER_GENERATION
from app.services.billing.context import bill_ai
from app.services.billing.settings_store import (
    config_payload,
    default_config,
    get_billing_config,
    save_billing_settings,
    settings_from_payload,
)
from tests.integration.conftest import open_sqlite_maker


async def _bind(monkeypatch):
    _engine, maker = await open_sqlite_maker()
    monkeypatch.setattr("app.database.async_session_maker", maker)

    async def _ok(*_a, **_k):
        return "ok"

    monkeypatch.setattr("app.services.ai_client._run_text", _ok)
    return maker


async def _set_payment(maker, enabled: bool) -> None:
    data = config_payload(default_config())
    data["payment_enabled"] = enabled
    async with maker() as db:
        await save_billing_settings(db, data)


async def _rows(maker, model):
    async with maker() as db:
        return (await db.execute(select(model))).scalars().all()


def test_payment_is_disabled_by_default():
    assert default_config().payment_enabled is False
    assert config_payload(default_config())["payment_enabled"] is False


def test_payload_round_trips_the_flag():
    data = config_payload(default_config())
    data["payment_enabled"] = True
    assert settings_from_payload(data).payment_enabled is True
    del data["payment_enabled"]
    assert settings_from_payload(data).payment_enabled is False


@pytest.mark.asyncio
async def test_no_row_means_disabled(monkeypatch):
    maker = await _bind(monkeypatch)
    async with maker() as db:
        assert (await get_billing_config(db)).payment_enabled is False


@pytest.mark.asyncio
async def test_disabled_never_debits_students(monkeypatch):
    maker = await _bind(monkeypatch)
    user = SimpleNamespace(id=5, role="student")
    async with bill_ai(user, STUDENT_AI):
        for _ in range(STUDENT_FREE_CREDITS + 3):  # dépasse le quota gratuit sans erreur 402
            assert await generate_text("q") == "ok"
    assert await _rows(maker, AiUsage) == []
    assert all(w.free_remaining == STUDENT_FREE_CREDITS for w in await _rows(maker, AiWallet))


@pytest.mark.asyncio
async def test_disabled_never_debits_teachers(monkeypatch):
    maker = await _bind(monkeypatch)
    teacher = SimpleNamespace(id=6, role="teacher")
    async with bill_ai(teacher, TEACHER_GENERATION, 3):
        for _ in range(12):
            await generate_text("batch", for_generation=True)
    assert await _rows(maker, AiUsage) == []


@pytest.mark.asyncio
async def test_enabling_starts_debiting(monkeypatch):
    maker = await _bind(monkeypatch)
    await _set_payment(maker, True)
    user = SimpleNamespace(id=7, role="student")
    async with bill_ai(user, STUDENT_AI):
        await generate_text("q")
    wallet = (await _rows(maker, AiWallet))[0]
    assert wallet.free_remaining == STUDENT_FREE_CREDITS - 1
