from datetime import datetime, timezone
from types import SimpleNamespace

from app.models.enums import ExamStatus
from app.schemas.task import TaskReviewOut
from app.services.practice_release import (
    block_reason,
    deploy_block_reason,
    mark_deployed,
    mark_grading_locked,
    should_record_score,
    withhold_student_grade,
    without_grades,
    write_official_score,
    write_practice_score,
)


def _exam(kind: str = "tirgoul", private_student_id: int | None = None):
    return SimpleNamespace(kind=kind, is_tirgoul=kind == "tirgoul", private_student_id=private_student_id)


def _session(status: ExamStatus = ExamStatus.DRAFT, locked: bool = False):
    return SimpleNamespace(status=status, grading_locked=locked, activated_at=None, integrity_mode_enabled=True)


def test_deploy_waits_for_content_on_a_class_practice():
    draft = _session()
    assert deploy_block_reason(_exam("official"), draft, 2) == "not_practice"
    assert deploy_block_reason(_exam(private_student_id=4), draft, 2) == "not_practice"
    assert deploy_block_reason(_exam(), draft, 0) == "empty"
    assert deploy_block_reason(_exam("task"), draft, 1) is None
    assert deploy_block_reason(_exam(), _session(ExamStatus.ACTIVE), 1) == "already"


def test_block_only_after_the_exercise_is_live():
    assert block_reason(_exam(), _session(ExamStatus.DRAFT)) == "unavailable"
    assert block_reason(_exam("task"), _session(ExamStatus.ACTIVE)) is None
    assert block_reason(_exam(), _session(ExamStatus.ACTIVE, locked=True)) == "unavailable"


def test_locked_submission_does_not_replace_an_existing_score():
    attempt = SimpleNamespace(score=4, max_score=5, practice_score=1, practice_max_score=5)
    write_official_score(attempt, 0, 5, record=False)
    write_practice_score(attempt, 0, 5, record=False)
    assert (attempt.score, attempt.practice_score) == (4, 1)
    fresh = SimpleNamespace(score=None, max_score=None, practice_score=None, practice_max_score=None)
    write_official_score(fresh, 3, 5, record=False)
    assert fresh.score is None
    write_official_score(fresh, 3, 5, record=True)
    assert fresh.score == 3


def test_withhold_hides_a_missing_grade_and_keeps_an_earned_one():
    locked = SimpleNamespace(grading_locked=True)
    assert should_record_score(locked) is False
    assert withhold_student_grade(locked, SimpleNamespace(score=None)) is True
    assert withhold_student_grade(locked, SimpleNamespace(score=0)) is False
    row = TaskReviewOut(
        step_id=1, title="צילום", instructions="הראה", max_points=2, order_index=0,
        verdict="done", score=2, ai_score=2, appreciation="טוב", source="teacher", has_proof=True,
    )
    hidden = without_grades([row])[0]
    assert hidden.score is None and hidden.verdict is None and hidden.has_proof is True


def test_deploy_clears_the_lock_and_block_sets_it():
    session = _session()
    now = datetime.now(timezone.utc)
    assert mark_deployed(session, now) is True
    assert session.status == ExamStatus.ACTIVE and session.grading_locked is False
    mark_grading_locked(session)
    assert session.grading_locked is True
    assert mark_deployed(session, now) is False
    assert session.grading_locked is False and session.status == ExamStatus.ACTIVE
