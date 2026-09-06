from app.models.enums import ExamStatus
from app.services.exam_lifecycle import student_visible_session_statuses


def test_students_see_active_and_closed_not_draft():
    statuses = student_visible_session_statuses()
    assert ExamStatus.ACTIVE in statuses
    assert ExamStatus.CLOSED in statuses
    assert ExamStatus.DRAFT not in statuses
