"""Réinitialise le mot de passe (et optionnellement l'email) d'un administrateur.

Usage (depuis backend/, DATABASE_URL dans .env = Neon ou local) :
  python -m scripts.reset_admin_password
  $env:ADMIN_EMAIL="admin@example.com"; $env:ADMIN_PASSWORD="MonMdp123!"; python -m scripts.reset_admin_password
  # Ancien compte .local : $env:ADMIN_OLD_EMAIL="admin@assistant-ai.local"
"""
import asyncio
import os

from sqlalchemy import select

from app.database import async_session_maker
from app.models.enums import UserRole
from app.models.user import User
from app.security import hash_password


async def _find_admin(db, email: str, old_email: str | None) -> User | None:
    for candidate in (email, old_email):
        if not candidate:
            continue
        row = await db.execute(select(User).where(User.email == candidate))
        user = row.scalar_one_or_none()
        if user:
            return user
    row = await db.execute(select(User).where(User.role == UserRole.ADMIN).limit(1))
    return row.scalar_one_or_none()


async def main() -> None:
    email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    password = os.environ.get("ADMIN_PASSWORD", "admin123")
    old_email = os.environ.get("ADMIN_OLD_EMAIL", "admin@assistant-ai.local")

    async with async_session_maker() as db:
        user = await _find_admin(db, email, old_email)
        if not user:
            print("Aucun admin trouvé. Lancez: python -m scripts.seed_admin")
            return
        user.email = email
        user.password_hash = hash_password(password)
        user.email_verified = True
        await db.commit()
        print(f"Admin mis à jour: {email} / {password}")


if __name__ == "__main__":
    asyncio.run(main())
