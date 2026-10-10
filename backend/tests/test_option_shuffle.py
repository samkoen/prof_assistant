import random
from types import SimpleNamespace

from app.models.enums import QuestionType
from app.schemas.exam import QuestionCreate, QuestionOptionCreate
from app.services.exam_kind import apply_exam_kind, should_shuffle_options, should_shuffle_questions
from app.services.option_shuffle import (
    is_pinned_last,
    references_letters,
    shuffle_generated_questions,
    shuffle_question_options,
    shuffled_options,
)


def _question(texts: list[str], correct: int = 0, qtype=QuestionType.SINGLE) -> QuestionCreate:
    options = [
        QuestionOptionCreate(text=t, is_correct=i == correct, order_index=i) for i, t in enumerate(texts)
    ]
    return QuestionCreate(text="?", question_type=qtype, options=options)


def test_correct_answer_no_longer_always_first():
    positions = set()
    for seed in range(40):
        q = _question(["a1", "b2", "c3", "d4"])
        shuffle_question_options(q, random.Random(seed))
        positions.add(next(i for i, o in enumerate(q.options) if o.is_correct))
    assert positions == {0, 1, 2, 3}


def test_order_index_renumbered_and_correct_flag_follows_text():
    q = _question(["x", "y", "z"], correct=1)
    shuffle_question_options(q, random.Random(3))
    assert [o.order_index for o in q.options] == [0, 1, 2]
    assert [o.text for o in q.options if o.is_correct] == ["y"]


def test_all_of_the_above_stays_last():
    q = _question(["one", "two", "three", "כל התשובות נכונות"], correct=3)
    for seed in range(20):
        shuffle_question_options(q, random.Random(seed))
        assert q.options[-1].text == "כל התשובות נכונות"


def test_letter_references_keep_original_order():
    texts = ["only A", "A + B", "B and C", "none"]
    assert shuffled_options(texts, random.Random(1), str) == texts


def test_true_false_and_open_untouched():
    tf = _question(["נכון", "לא נכון"], qtype=QuestionType.TRUE_FALSE)
    open_q = QuestionCreate(text="?", question_type=QuestionType.OPEN)
    shuffle_generated_questions([tf, open_q], random.Random(0))
    assert [o.text for o in tf.options] == ["נכון", "לא נכון"]
    assert open_q.options == []


def test_detectors():
    assert is_pinned_last("None of the above")
    assert not is_pinned_last("בית ספר")
    assert references_letters("A ו-B")
    assert not references_letters("A cat")


def test_tirgoul_keeps_question_order_but_shuffles_options():
    exam = SimpleNamespace(is_tirgoul=True, shuffle_questions=True, shuffle_options=False, auto_submit_on_timeout=True)
    assert should_shuffle_questions(exam) is False
    assert should_shuffle_options(exam) is True
    apply_exam_kind(exam, True)
    assert exam.shuffle_options is True and exam.shuffle_questions is False
