from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.models.enums import OfferingTeacherRole, UserRole
from app.services.offering_access import teacher_owns_offering
from app.services.offering_teacher_rules import (
    ensure_can_leave,
    ensure_can_remove_member,
    ensure_inviter_owns_offering,
    ensure_no_pending_invite,
    ensure_not_already_member,
    ensure_recipient_is_invitable,
)
from app.services.offering_teacher_service import teacher_refs_from_members


def test_teacher_owns_offering():
    offering = SimpleNamespace(teacher_id=7)
    assert teacher_owns_offering(offering, 7) is True
    assert teacher_owns_offering(offering, 8) is False


def test_invite_rules_owner_and_self():
    offering = SimpleNamespace(teacher_id=3)
    ensure_inviter_owns_offering(offering, 3)
    with pytest.raises(HTTPException) as forbidden:
        ensure_inviter_owns_offering(offering, 9)
    assert forbidden.value.status_code == 403

    recipient = SimpleNamespace(id=4, role=UserRole.TEACHER, is_blocked=False)
    ensure_recipient_is_invitable(recipient, 3)
    with pytest.raises(HTTPException) as self_invite:
        ensure_recipient_is_invitable(recipient, 4)
    assert self_invite.value.status_code == 400


def test_invite_rules_blocked_or_student():
    blocked = SimpleNamespace(id=2, role=UserRole.TEACHER, is_blocked=True)
    student = SimpleNamespace(id=2, role=UserRole.STUDENT, is_blocked=False)
    with pytest.raises(HTTPException) as missing:
        ensure_recipient_is_invitable(blocked, 1)
    assert missing.value.status_code == 404
    with pytest.raises(HTTPException) as not_teacher:
        ensure_recipient_is_invitable(student, 1)
    assert not_teacher.value.status_code == 404


def test_member_and_pending_guards():
    ensure_not_already_member(False)
    with pytest.raises(HTTPException) as member:
        ensure_not_already_member(True)
    assert member.value.status_code == 400
    ensure_no_pending_invite(False)
    with pytest.raises(HTTPException) as pending:
        ensure_no_pending_invite(True)
    assert pending.value.status_code == 400


def test_cannot_remove_or_leave_as_owner():
    ensure_can_remove_member(OfferingTeacherRole.CO_TEACHER.value)
    with pytest.raises(HTTPException) as remove_owner:
        ensure_can_remove_member(OfferingTeacherRole.OWNER.value)
    assert remove_owner.value.status_code == 403
    ensure_can_leave(OfferingTeacherRole.CO_TEACHER.value)
    with pytest.raises(HTTPException) as leave_owner:
        ensure_can_leave(OfferingTeacherRole.OWNER.value)
    assert leave_owner.value.status_code == 400


def test_teacher_refs_sorts_owner_first():
    offering = SimpleNamespace(teacher_id=1, teacher=SimpleNamespace(full_name="A"))
    members = [
        SimpleNamespace(
            teacher_id=2,
            role=OfferingTeacherRole.CO_TEACHER.value,
            teacher=SimpleNamespace(full_name="בית"),
        ),
        SimpleNamespace(
            teacher_id=1,
            role=OfferingTeacherRole.OWNER.value,
            teacher=SimpleNamespace(full_name="אלון"),
        ),
    ]
    refs = teacher_refs_from_members(members, offering)
    assert [r.role.value for r in refs] == ["owner", "co_teacher"]
    assert refs[0].name == "אלון"


def test_teacher_refs_fallback_to_offering_owner():
    offering = SimpleNamespace(teacher_id=11, teacher=SimpleNamespace(full_name="רק אני"))
    refs = teacher_refs_from_members([], offering)
    assert len(refs) == 1
    assert refs[0].id == 11
    assert refs[0].role == OfferingTeacherRole.OWNER
    assert refs[0].name == "רק אני"
