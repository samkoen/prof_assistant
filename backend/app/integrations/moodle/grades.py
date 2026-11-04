"""Conversion des notes locales vers le barème d'un devoir Moodle."""

from __future__ import annotations

from dataclasses import dataclass

NO_MOODLE_LINK = "אין קישור Moodle לתלמיד"
NO_SCORE = "אין ציון"


@dataclass(frozen=True)
class AttemptGrade:
    student_id: int
    student_name: str
    score: float | None
    max_score: float | None


@dataclass(frozen=True)
class GradeSkip:
    student_name: str
    reason: str


def moodle_points(score: float | None, max_score: float | None, grade_max: float) -> float | None:
    if score is None or max_score is None or max_score <= 0 or grade_max <= 0:
        return None
    scaled = (score / max_score) * grade_max
    if scaled < 0:
        return 0.0
    if scaled > grade_max:
        return float(grade_max)
    return round(scaled, 5)


def build_grade_payload(
    attempts: list[AttemptGrade],
    moodle_user_ids: dict[int, int],
    grade_max: float,
) -> tuple[list[tuple[int, float]], list[GradeSkip]]:
    sent: list[tuple[int, float]] = []
    skipped: list[GradeSkip] = []
    for attempt in attempts:
        moodle_user_id = moodle_user_ids.get(attempt.student_id)
        points = moodle_points(attempt.score, attempt.max_score, grade_max)
        if moodle_user_id is None:
            skipped.append(GradeSkip(attempt.student_name, NO_MOODLE_LINK))
        elif points is None:
            skipped.append(GradeSkip(attempt.student_name, NO_SCORE))
        else:
            sent.append((moodle_user_id, points))
    return sent, skipped


def grade_fields(assignment_id: int, grades: list[tuple[int, float]]) -> list[tuple[str, str]]:
    fields = [("assignmentid", str(assignment_id)), ("applytoall", "0")]
    for index, (user_id, grade) in enumerate(grades):
        prefix = f"grades[{index}]"
        fields.append((f"{prefix}[userid]", str(user_id)))
        fields.append((f"{prefix}[grade]", str(grade)))
        fields.append((f"{prefix}[attemptnumber]", "-1"))
        fields.append((f"{prefix}[addattempt]", "0"))
    return fields
