from datetime import date

import pytest

from app.integrations.moodle.calendar import clip_label, current_academic_year
from app.integrations.moodle.crypto import decrypt_token, encrypt_token
from app.integrations.moodle.grades import (
    NO_MOODLE_LINK,
    NO_SCORE,
    AttemptGrade,
    build_grade_payload,
    grade_fields,
    moodle_points,
)
from app.integrations.moodle.parse import (
    MoodleApiError,
    MoodleStudent,
    match_students_by_email,
    normalize_base_url,
    parse_assignments,
    parse_courses,
    parse_students,
    raise_if_moodle_error,
)
from app.schemas.moodle import MoodleConnectionStatus


def test_connection_status_has_no_token():
    assert "token" not in MoodleConnectionStatus.model_fields
    payload = MoodleConnectionStatus(
        connected=True, base_url="https://moodle.example", moodle_user_id=4
    )
    assert "token" not in payload.model_dump()


def test_https_base_url_only():
    assert normalize_base_url("https://moodle.example/moodle/") == "https://moodle.example/moodle"
    with pytest.raises(ValueError):
        normalize_base_url("http://moodle.example")


def test_token_roundtrip_hides_plaintext():
    secret = "app-secret"
    encrypted = encrypt_token(secret, "moodle-token-value")
    assert "moodle-token-value" not in encrypted
    assert decrypt_token(secret, encrypted) == "moodle-token-value"


def test_moodle_exception_message():
    with pytest.raises(MoodleApiError, match="Invalid token"):
        raise_if_moodle_error(
            {"exception": "webservice_access_exception", "message": "Invalid token"}
        )


def test_parse_courses_and_students():
    courses = parse_courses(
        [
            {"id": 7, "shortname": "MATH", "fullname": "מתמטיקה"},
            {"fullname": "sans id"},
        ]
    )
    assert [(course.id, course.shortname) for course in courses] == [(7, "MATH")]
    students = parse_students(
        [
            {"id": 1, "email": "a@b.c", "fullname": "תלמיד", "roles": [{"shortname": "student"}]},
            {
                "id": 2,
                "email": "t@b.c",
                "fullname": "מורה",
                "roles": [{"shortname": "editingteacher"}],
            },
            {"id": 3, "email": "", "fullname": "בלי מייל", "roles": [{"shortname": "student"}]},
        ]
    )
    assert [student.email for student in students] == ["a@b.c", ""]


def test_match_email_is_case_insensitive():
    student = MoodleStudent(5, "Ada@School.com", "Ada")
    blank = MoodleStudent(6, "  ", "בלי")
    matched, unknown = match_students_by_email([student, blank], {"ada@school.com": 9})
    assert matched == [(9, student)]
    assert unknown == [blank]


def test_parse_assignments_for_course():
    payload = {"courses": [{"id": 4, "assignments": [{"id": 12, "name": "מבחן", "grade": 0}]}]}
    rows = parse_assignments(payload, 4)
    assert rows[0].id == 12
    assert rows[0].grade_max == 100
    assert parse_assignments(payload, 9) == []


def test_scale_grade_and_payload():
    assert moodle_points(8, 10, 100) == 80
    assert moodle_points(15, 10, 100) == 100
    assert moodle_points(8, 0, 100) is None
    attempts = [
        AttemptGrade(1, "עדה", 8, 10),
        AttemptGrade(2, "בלי קישור", 5, 10),
        AttemptGrade(3, "בלי ציון", None, 10),
    ]
    sent, skipped = build_grade_payload(attempts, {1: 50, 3: 70}, 100)
    assert sent == [(50, 80)]
    assert [item.reason for item in skipped] == [NO_MOODLE_LINK, NO_SCORE]


def test_grade_form_has_no_token():
    fields = grade_fields(3, [(9, 80.0)])
    assert "wstoken" not in {key for key, _value in fields}
    assert ("assignmentid", "3") in fields
    assert ("grades[0][userid]", "9") in fields


def test_academic_year_and_label():
    assert current_academic_year(date(2026, 11, 4)) == 2026
    assert current_academic_year(date(2026, 3, 1)) == 2025
    assert clip_label("  שם   ארוך  ") == "שם ארוך"
