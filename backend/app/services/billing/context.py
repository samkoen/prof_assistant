"""Contexte d'appel IA : qui paie, pour quel produit, quelle session prof."""

from contextlib import asynccontextmanager
from contextvars import ContextVar
from dataclasses import dataclass


@dataclass(frozen=True)
class AiBilling:
    user_id: int
    role: str
    product: str
    generation_session_id: int | None = None


_current: ContextVar[AiBilling | None] = ContextVar("ai_billing", default=None)


def current_billing() -> AiBilling | None:
    return _current.get()


def role_name(user) -> str:
    role = user.role
    return role.value if hasattr(role, "value") else str(role)


@asynccontextmanager
async def bill_ai(user, product: str, generation_session_id: int | None = None):
    token = _current.set(
        AiBilling(user.id, role_name(user), product, generation_session_id)
    )
    try:
        yield
    finally:
        _current.reset(token)
