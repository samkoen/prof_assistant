"""Lecture des réponses Moodle. Aucun appel réseau."""

from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlparse


class MoodleApiError(Exception):
    """Réponse Moodle inutilisable. Ne contient jamais le jeton."""


@dataclass(frozen=True)
class MoodleCourse:
    id: int
    shortname: str
    fullname: str


@dataclass(frozen=True)
class MoodleStudent:
    moodle_id: int
    email: str
    fullname: str


@dataclass(frozen=True)
class MoodleAssignment:
    id: int
    name: str
    grade_max: float


def normalize_base_url(raw: str) -> str:
    url = (raw or "").strip().rstrip("/")
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc:
        raise ValueError("https required")
    return url


def raise_if_moodle_error(payload: object) -> None:
    if isinstance(payload, dict) and payload.get("exception"):
        message = str(payload.get("message") or payload.get("errorcode") or "Moodle")
        raise MoodleApiError(message)


def site_user_id(payload: object) -> int:
    if isinstance(payload, dict) and payload.get("userid") is not None:
        return int(payload["userid"])
    raise MoodleApiError("תשובת Moodle אינה תקינה")


def parse_courses(payload: object) -> list[MoodleCourse]:
    if not isinstance(payload, list):
        return []
    return [course for row in payload if (course := _course(row)) is not None]


def parse_students(payload: object) -> list[MoodleStudent]:
    if not isinstance(payload, list):
        return []
    return [student for row in payload if (student := _student(row)) is not None]


def parse_assignments(payload: object, course_id: int) -> list[MoodleAssignment]:
    courses = payload.get("courses") if isinstance(payload, dict) else None
    if not isinstance(courses, list):
        return []
    found: list[MoodleAssignment] = []
    for course in courses:
        found.extend(_assignments_of(course, course_id))
    return found


def match_students_by_email(
    students: list[MoodleStudent],
    users_by_email: dict[str, int],
) -> tuple[list[tuple[int, MoodleStudent]], list[MoodleStudent]]:
    matched: list[tuple[int, MoodleStudent]] = []
    unknown: list[MoodleStudent] = []
    for student in students:
        user_id = users_by_email.get(student.email.strip().lower())
        if not student.email.strip() or user_id is None:
            unknown.append(student)
        else:
            matched.append((user_id, student))
    return matched, unknown


def _course(row: object) -> MoodleCourse | None:
    if not isinstance(row, dict) or row.get("id") is None:
        return None
    fullname = _text(row, "fullname", str(row["id"]))
    return MoodleCourse(
        id=int(row["id"]), shortname=_text(row, "shortname", fullname), fullname=fullname
    )


def _student(row: object) -> MoodleStudent | None:
    if (
        not isinstance(row, dict)
        or row.get("id") is None
        or not _has_student_role(row.get("roles"))
    ):
        return None
    email = str(row.get("email") or "").strip()
    fullname = str(row.get("fullname") or "").strip() or email or str(row["id"])
    return MoodleStudent(moodle_id=int(row["id"]), email=email, fullname=fullname)


def _has_student_role(roles: object) -> bool:
    if not isinstance(roles, list):
        return False
    return any(isinstance(role, dict) and role.get("shortname") == "student" for role in roles)


def _assignments_of(course: object, course_id: int) -> list[MoodleAssignment]:
    if not isinstance(course, dict) or int(course.get("id") or 0) != course_id:
        return []
    items = course.get("assignments")
    if not isinstance(items, list):
        return []
    return [item for row in items if (item := _assignment(row)) is not None]


def _assignment(row: object) -> MoodleAssignment | None:
    if not isinstance(row, dict) or row.get("id") is None:
        return None
    return MoodleAssignment(
        id=int(row["id"]),
        name=_text(row, "name", str(row["id"])),
        grade_max=_grade_max(row.get("grade")),
    )


def _grade_max(raw: object) -> float:
    try:
        value = float(raw)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 100.0
    return value if value > 0 else 100.0


def _text(row: dict, key: str, fallback: str) -> str:
    value = row.get(key)
    text = str(value).strip() if value is not None else ""
    return text or fallback
