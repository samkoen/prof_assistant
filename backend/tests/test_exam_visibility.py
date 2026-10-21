from types import SimpleNamespace

from app.models.enums import ExamStatus
from app.services.exam_lifecycle import student_visible_session_statuses
from app.services.exam_visibility import student_can_see_exam


def test_students_see_active_and_closed_not_draft():
    statuses = student_visible_session_statuses()
    assert ExamStatus.ACTIVE in statuses
    assert ExamStatus.CLOSED in statuses
    assert ExamStatus.DRAFT not in statuses


def _exam(*, hidden: bool = False, private_student_id: int | None = None):
    return SimpleNamespace(hidden_from_students=hidden, private_student_id=private_student_id)


def test_hidden_exam_is_invisible_to_every_student():
    exam = _exam(hidden=True)
    assert student_can_see_exam(exam, 1) is False
    assert student_can_see_exam(exam, 2) is False


def test_private_exam_stays_visible_only_to_its_student():
    exam = _exam(private_student_id=4)
    assert student_can_see_exam(exam, 4) is True
    assert student_can_see_exam(exam, 5) is False


def test_class_exam_stays_visible():
    assert student_can_see_exam(_exam(), 9) is True
