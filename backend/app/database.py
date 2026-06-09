import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import settings

_connect_args = {"ssl": True} if settings.database_ssl else {}
_is_serverless = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))


def _build_engine():
    kwargs: dict = {
        "connect_args": _connect_args,
        "echo": settings.sqlalchemy_echo(),
        "pool_pre_ping": True,
    }
    if _is_serverless:
        kwargs["poolclass"] = NullPool
    else:
        kwargs["pool_recycle"] = 280
    return create_async_engine(settings.database_url, **kwargs)


engine = _build_engine()
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
