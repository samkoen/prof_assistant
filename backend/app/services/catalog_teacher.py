"""Cours catalogue — propriété et accès par professeur."""

from fastapi import HTTPException

from app.models.course import CourseCatalog
from app.models.enums import UserRole
from app.models.user import User


def resolve_catalog_teacher_id(user: User, requested_teacher_id: int | None) -> int:
    if user.role == UserRole.TEACHER:
        return user.id
    if requested_teacher_id is None:
        raise HTTPException(status_code=400, detail="יש לבחור מורה")
    return requested_teacher_id


def teacher_owns_catalog(catalog: CourseCatalog, user: User) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    return catalog.teacher_id == user.id


def ensure_teacher_owns_catalog(catalog: CourseCatalog | None, user: User) -> CourseCatalog:
    if not catalog:
        raise HTTPException(status_code=404, detail="קורס קטלוג לא נמצא")
    if not teacher_owns_catalog(catalog, user):
        raise HTTPException(status_code=403, detail="אין הרשאה")
    return catalog


def enforce_teacher_scope_id(user: User, scope_teacher_id: int | None) -> int | None:
    if user.role == UserRole.TEACHER:
        return user.id
    return scope_teacher_id
