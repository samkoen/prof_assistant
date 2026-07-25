import pytest
from fastapi import HTTPException

from app.services.integrity_service import (
    EXAM_SESSION_TOKEN_CONFLICT,
    assert_exam_session_token,
    bind_exam_session_token,
)

from tests.helpers import make_attempt, make_session


def test_assert_skipped_without_integrity():
    assert_exam_session_token(make_session(integrity=False), make_attempt(), None)


def test_assert_skipped_before_start():
    assert_exam_session_token(
        make_session(), make_attempt(started=False, session_token="abc"), None
    )


def test_assert_skipped_after_submit():
    assert_exam_session_token(
        make_session(),
        make_attempt(submitted=True, session_token="abc"),
        None,
    )


def test_assert_rejects_missing_or_wrong_token():
    attempt = make_attempt(session_token="good-token")
    session = make_session()
    with pytest.raises(HTTPException) as missing:
        assert_exam_session_token(session, attempt, None)
    assert missing.value.status_code == 409
    assert missing.value.detail == EXAM_SESSION_TOKEN_CONFLICT

    with pytest.raises(HTTPException) as wrong:
        assert_exam_session_token(session, attempt, "other-token")
    assert wrong.value.status_code == 409


def test_assert_accepts_matching_token():
    assert_exam_session_token(
        make_session(), make_attempt(session_token="good-token"), "good-token"
    )


def test_bind_issues_token_when_starting():
    attempt = make_attempt(session_token=None, started=False)
    bind_exam_session_token(
        make_session(), attempt, None, starting_fresh=True
    )
    assert attempt.session_token
    assert len(attempt.session_token) == 64


def test_bind_keeps_token_when_client_matches():
    attempt = make_attempt(session_token="same-token")
    bind_exam_session_token(
        make_session(), attempt, "same-token", starting_fresh=False
    )
    assert attempt.session_token == "same-token"


def test_bind_rotates_when_client_has_no_token():
    attempt = make_attempt(session_token="old-token")
    bind_exam_session_token(
        make_session(), attempt, None, starting_fresh=False
    )
    assert attempt.session_token != "old-token"


def test_bind_noop_without_integrity():
    attempt = make_attempt(session_token="keep")
    bind_exam_session_token(
        make_session(integrity=False), attempt, None, starting_fresh=True
    )
    assert attempt.session_token == "keep"
