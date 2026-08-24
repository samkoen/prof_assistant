from collections.abc import AsyncIterator
import logging

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import tests.integration.sqlite_compat  # noqa: F401
import app.models  # noqa: F401
from app.database import Base, get_db
from tests.integration.ai_mocks import install_ai_mocks
from tests.integration.seed import SeededUsers, seed_core_users


class ItEnv:
    def __init__(self, client: AsyncClient, users: SeededUsers):
        self.client = client
        self.users = users


async def open_sqlite_maker():
    logging.getLogger("aiosqlite").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return engine, maker


def bind_test_db(app, maker: async_sessionmaker) -> None:
    async def override_get_db():
        async with maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
async def it_env(monkeypatch) -> AsyncIterator[ItEnv]:
    engine, maker = await open_sqlite_maker()
    monkeypatch.setattr("app.database.async_session_maker", maker)
    install_ai_mocks(monkeypatch)
    users = await seed_core_users(maker)
    from app.main import app

    bind_test_db(app, maker)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield ItEnv(client=client, users=users)
    app.dependency_overrides.clear()
    await engine.dispose()
