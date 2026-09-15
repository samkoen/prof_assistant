import pytest
from fastapi import HTTPException

from app.models.enums import UserRole
from app.services.auth_messages import SELF_REGISTER_ROLE_FORBIDDEN
from app.services.auth_register import resolve_self_register_role, student_id_for_register


def test_self_register_allows_student_and_teacher():
    assert resolve_self_register_role(UserRole.STUDENT) == UserRole.STUDENT
    assert resolve_self_register_role(UserRole.TEACHER) == UserRole.TEACHER


def test_self_register_rejects_admin():
    with pytest.raises(HTTPException) as exc:
        resolve_self_register_role(UserRole.ADMIN)
    assert exc.value.status_code == 400
    assert exc.value.detail == SELF_REGISTER_ROLE_FORBIDDEN


def test_student_id_only_kept_for_students():
    assert student_id_for_register(UserRole.STUDENT, "12345") == "12345"
    assert student_id_for_register(UserRole.TEACHER, "12345") is None
    assert student_id_for_register(UserRole.ADMIN, "12345") is None
