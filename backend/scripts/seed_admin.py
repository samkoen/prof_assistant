"""Créer le premier administrateur.

Usage (depuis le dossier backend/) :
  python -m scripts.seed_admin
"""
import asyncio
import os

from sqlalchemy import select

from app.database import Base, async_session_maker, engine
from app.models.enums import UserRole
from app.models.user import User
from app.security import hash_password


async def main() -> None:
    email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    password = os.environ.get("ADMIN_PASSWORD", "admin123")
    name = os.environ.get("ADMIN_NAME", "מנהל מערכת")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as db:
        existing = await db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            print(f"Admin already exists: {email}")
            return
        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name=name,
            role=UserRole.ADMIN,
            email_verified=True,
        )
        db.add(user)
        await db.commit()
        print(f"Admin created: {email} / {password}")


if __name__ == "__main__":
    asyncio.run(main())
