"""Inscription publique : élève ou professeur, jamais admin."""

from fastapi import HTTPException

from app.models.enums import UserRole
from app.services.auth_messages import SELF_REGISTER_ROLE_FORBIDDEN

SELF_REGISTER_ROLES = frozenset({UserRole.STUDENT, UserRole.TEACHER})


def resolve_self_register_role(role: UserRole) -> UserRole:
    if role not in SELF_REGISTER_ROLES:
        raise HTTPException(status_code=400, detail=SELF_REGISTER_ROLE_FORBIDDEN)
    return role


def student_id_for_register(role: UserRole, student_id: str | None) -> str | None:
    if role != UserRole.STUDENT:
        return None
    return student_id
