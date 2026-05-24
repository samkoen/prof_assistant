"""Crée toutes les tables SQLAlchemy dans PostgreSQL (sans données).

Usage (depuis le dossier backend/) :
  python -m scripts.init_db
"""
import asyncio

from app.database import Base, engine
from app.models import *  # noqa: F401, F403


async def main() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("OK: tables created (SQLAlchemy create_all).")


if __name__ == "__main__":
    asyncio.run(main())
