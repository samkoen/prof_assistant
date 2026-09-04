from types import SimpleNamespace

from app.services.exam_kind import (
    apply_exam_kind,
    hide_attempt_score,
    integrity_on_activate,
    should_shuffle,
    student_sees_official_results,
)


def test_official_exam_shuffles_and_tracks():
    exam = SimpleNamespace(is_tirgoul=False, shuffle_questions=False, shuffle_options=False)
    apply_exam_kind(exam, False)
    assert exam.shuffle_questions is True
    assert exam.shuffle_options is True
    assert should_shuffle(exam) is True
    assert integrity_on_activate(exam) is True


def test_tirgoul_keeps_order_and_shows_score_immediately():
    exam = SimpleNamespace(
        is_tirgoul=False, shuffle_questions=True, shuffle_options=True, auto_submit_on_timeout=True
    )
    apply_exam_kind(exam, True)
    assert exam.is_tirgoul is True
    assert should_shuffle(exam) is False
    assert integrity_on_activate(exam) is False
    session = SimpleNamespace(results_published=False)
    attempt = SimpleNamespace(submitted_at="now")
    assert student_sees_official_results(exam, session) is True
    assert hide_attempt_score(exam, session, attempt) is False


def test_official_hides_score_until_published():
    exam = SimpleNamespace(is_tirgoul=False)
    session = SimpleNamespace(results_published=False)
    attempt = SimpleNamespace(submitted_at="now")
    assert hide_attempt_score(exam, session, attempt) is True
    session.results_published = True
    assert hide_attempt_score(exam, session, attempt) is False
