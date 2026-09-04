from types import SimpleNamespace

from app.models.enums import QuestionType
from app.services.exam_answer_key import apply_option_correct_flags, validate_question_key


def test_validate_single_needs_one_correct():
    opts = {1, 2, 3}
    assert validate_question_key(QuestionType.SINGLE, opts, {2}) is None
    assert validate_question_key(QuestionType.SINGLE, opts, {1, 2}) is not None
    assert validate_question_key(QuestionType.SINGLE, opts, set()) is not None
    assert validate_question_key(QuestionType.SINGLE, opts, {9}) is not None


def test_validate_rejects_open_and_foreign_option():
    assert validate_question_key(QuestionType.OPEN, set(), {1}) is not None
    assert validate_question_key(QuestionType.MULTIPLE, {1, 2}, {1, 2}) is None
    assert validate_question_key(QuestionType.TRUE_FALSE, {1, 2}, {1, 2}) is not None


def test_apply_option_flags_keeps_ids():
    options = [
        SimpleNamespace(id=1, is_correct=True),
        SimpleNamespace(id=2, is_correct=False),
    ]
    assert apply_option_correct_flags(options, {2}) is True
    assert options[0].is_correct is False
    assert options[1].is_correct is True
    assert apply_option_correct_flags(options, {2}) is False
