import asyncio

from sqlalchemy import text

from app.database import async_session_maker


async def main() -> None:
    async with async_session_maker() as db:
        r = await db.execute(
            text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='users' AND column_name='created_by_id'"
            )
        )
        print("column_exists", bool(r.fetchall()))
        v = await db.execute(text("SELECT version_num FROM alembic_version"))
        print("alembic_version", v.scalar())


if __name__ == "__main__":
    asyncio.run(main())
