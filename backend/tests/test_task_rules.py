from types import SimpleNamespace

import pytest

from app.models.enums import ExamKind, TaskReviewSource, TaskVerdict
from app.services.billing.constants import TEACHER_GENERATION
from app.services.billing.context import current_billing
from app.services.exam_kind import apply_task_kind, integrity_on_activate, is_task, is_tirgoul
from app.services.task_parse import parse_task_verification
from app.services.task_review import _call_model
from app.services.task_rules import (
    StepPoints,
    attempt_totals,
    auto_not_done,
    clamp_task_score,
    proof_rejection,
    step_text_error,
)


def test_task_kind_has_no_clock_or_integrity():
    exam = SimpleNamespace(is_tirgoul=True, kind=None, shuffle_questions=True, shuffle_options=True, auto_submit_on_timeout=True)
    apply_task_kind(exam)
    assert is_task(exam) is True
    assert is_tirgoul(exam) is False
    assert exam.kind == ExamKind.TASK
    assert exam.auto_submit_on_timeout is False
    assert integrity_on_activate(exam) is False


def test_description_is_required():
    assert step_text_error("כותרת", "") == "התיאור הוא שדה חובה"
    assert step_text_error("כותרת", "   ") == "התיאור הוא שדה חובה"
    assert step_text_error("  ", "תיאור") == "הכותרת היא שדה חובה"
    assert step_text_error("כותרת", "תיאור") is None


def test_missing_or_unknown_proof_is_rejected():
    assert proof_rejection("shot.png", 0, 100) == "הקובץ ריק"
    assert proof_rejection("shot.png", 200, 100) == "הקובץ גדול מדי"
    assert proof_rejection("code.py", 10, 100) == "סוג קובץ לא נתמך"
    assert proof_rejection("screen.PNG", 10, 100) is None


def test_score_is_clamped_and_empty_steps_count_as_zero():
    assert clamp_task_score(9, 3) == 3
    assert clamp_task_score(-1, 3) == 0
    earned, maximum = attempt_totals([StepPoints(1, 2), StepPoints(2, 4)], {1: 2})
    assert (earned, maximum) == (2, 6)


def test_parse_verdict_and_auto_not_done():
    parsed = parse_task_verification('{"verdict":"partial","score":1.5,"appreciation":"חלקי"}')
    assert parsed.verdict == "partial"
    assert parsed.score == 1.5
    verdict, score, source = auto_not_done()
    assert (verdict, score, source) == (TaskVerdict.NOT_DONE.value, 0.0, TaskReviewSource.AUTO.value)


@pytest.mark.asyncio
async def test_verification_uses_teacher_credits_and_clamps(monkeypatch):
    seen = []

    async def fake_generate(*_args, **_kwargs):
        seen.append(current_billing())
        return '{"verdict":"done","score":9,"appreciation":"בוצע"}'

    monkeypatch.setattr("app.services.task_review.generate_text", fake_generate)
    user = SimpleNamespace(id=4, role="teacher", ai_explanation_language="he")
    step = SimpleNamespace(title="צילום", instructions="הראה את המסך", max_points=2)
    parsed = await _call_model(user, step, "a.png", "image/png", b"img")
    assert seen[0] is not None
    assert seen[0].product == TEACHER_GENERATION
    assert parsed.score == 2
    assert parsed.verdict == "done"
