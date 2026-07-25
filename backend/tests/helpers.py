from types import SimpleNamespace

from app.models.enums import MultipleScoringMode, QuestionType


def make_option(option_id: int, *, is_correct: bool = False):
    return SimpleNamespace(id=option_id, is_correct=is_correct)


def make_question(
    question_id: int,
    *,
    points: float = 1.0,
    question_type: QuestionType = QuestionType.SINGLE,
    mode: MultipleScoringMode = MultipleScoringMode.ALL_OR_NOTHING,
    correct_ids: list[int] | None = None,
    option_ids: list[int] | None = None,
):
    correct = set(correct_ids or [])
    ids = option_ids or sorted(correct | {1, 2, 3, 4})
    options = [make_option(oid, is_correct=oid in correct) for oid in ids]
    return SimpleNamespace(
        id=question_id,
        points=points,
        question_type=question_type,
        multiple_scoring_mode=mode,
        options=options,
    )


def make_session(*, integrity: bool = True):
    return SimpleNamespace(integrity_mode_enabled=integrity)


def make_attempt(
    *,
    session_token: str | None = "tok",
    started: bool = True,
    submitted: bool = False,
    can_resubmit: bool = False,
):
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    return SimpleNamespace(
        session_token=session_token,
        started_at=now if started else None,
        submitted_at=now if submitted else None,
        can_resubmit=can_resubmit,
    )
