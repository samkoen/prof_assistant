from app.security import (
    create_access_token,
    create_email_verification_token,
    decode_email_verification_token,
    decode_session_token,
    hash_password,
    verify_password,
)
from app.models.enums import UserRole


def test_password_roundtrip():
    hashed = hash_password("secret123")
    assert hashed != "secret123"
    assert verify_password("secret123", hashed)
    assert not verify_password("wrong", hashed)


def test_session_token_accepted():
    token = create_access_token(42, UserRole.STUDENT)
    payload = decode_session_token(token)
    assert payload is not None
    assert payload["sub"] == "42"
    assert payload["role"] == UserRole.STUDENT.value
    assert "purpose" not in payload


def test_email_verify_token_rejected_as_session():
    token = create_email_verification_token(7)
    assert decode_session_token(token) is None
    assert decode_email_verification_token(token) == 7


def test_session_token_rejected_by_email_decoder():
    token = create_access_token(3, UserRole.TEACHER)
    assert decode_email_verification_token(token) is None


def test_garbage_token_returns_none():
    assert decode_session_token("not-a-jwt") is None
    assert decode_email_verification_token("not-a-jwt") is None
