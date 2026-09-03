from types import SimpleNamespace

from app.services.auth_verification import can_resend_verification


def test_can_resend_when_unverified():
    user = SimpleNamespace(
        is_blocked=False,
        email_verified=False,
        email_verified_by_teacher=False,
    )
    assert can_resend_verification(user) is True


def test_cannot_resend_when_missing_or_blocked():
    assert can_resend_verification(None) is False
    blocked = SimpleNamespace(
        is_blocked=True,
        email_verified=False,
        email_verified_by_teacher=False,
    )
    assert can_resend_verification(blocked) is False


def test_cannot_resend_when_already_verified():
    verified = SimpleNamespace(
        is_blocked=False,
        email_verified=True,
        email_verified_by_teacher=False,
    )
    by_teacher = SimpleNamespace(
        is_blocked=False,
        email_verified=False,
        email_verified_by_teacher=True,
    )
    assert can_resend_verification(verified) is False
    assert can_resend_verification(by_teacher) is False
