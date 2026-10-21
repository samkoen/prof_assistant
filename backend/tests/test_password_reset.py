from app.models.enums import UserRole
from app.models.user import User
from app.security import verify_password
from app.services.email_templates import password_reset_email_html, verification_email_html
from app.services.password_reset import assign_reset_password, can_send_reset


def _user(*, blocked: bool = False) -> User:
    return User(
        email="ada@school.test",
        password_hash="x",
        full_name="Ada",
        role=UserRole.STUDENT,
        is_blocked=blocked,
        email_verified=False,
    )


def test_blocked_or_unknown_user_gets_no_reset_mail():
    assert can_send_reset(None) is False
    assert can_send_reset(_user(blocked=True)) is False
    assert can_send_reset(_user()) is True


def test_assign_reset_password_verifies_email():
    user = _user()
    assign_reset_password(user, "new-secret")
    assert user.email_verified is True
    assert verify_password("new-secret", user.password_hash)


def test_password_reset_email_is_rtl_and_contains_link():
    html = password_reset_email_html(
        app_name="App",
        full_name="Ada",
        reset_url="https://x.test/reset?token=abc",
    )
    assert 'dir="rtl"' in html
    assert "איפוס סיסמה" in html
    assert "https://x.test/reset?token=abc" in html


def test_verification_email_keeps_its_call_to_action():
    html = verification_email_html(
        app_name="App",
        full_name="Ada",
        verify_url="https://x.test/verify?token=abc",
    )
    assert "אימות אימייל" in html
    assert "https://x.test/verify?token=abc" in html
