from app.models.enums import MultipleScoringMode, QuestionType
from app.services.scoring import score_exam_answers, score_question

from tests.helpers import make_question


def test_single_correct_and_wrong():
    q = make_question(1, points=2.0, correct_ids=[2], option_ids=[1, 2, 3])
    assert score_question(q, [2]) == (2.0, 2.0)
    assert score_question(q, [1]) == (0.0, 2.0)
    assert score_question(q, []) == (0.0, 2.0)


def test_multiple_all_or_nothing():
    q = make_question(
        1,
        points=4.0,
        question_type=QuestionType.MULTIPLE,
        mode=MultipleScoringMode.ALL_OR_NOTHING,
        correct_ids=[1, 3],
        option_ids=[1, 2, 3],
    )
    assert score_question(q, [1, 3]) == (4.0, 4.0)
    assert score_question(q, [1]) == (0.0, 4.0)


def test_multiple_proportional():
    q = make_question(
        1,
        points=4.0,
        question_type=QuestionType.MULTIPLE,
        mode=MultipleScoringMode.PROPORTIONAL,
        correct_ids=[1, 3],
        option_ids=[1, 2, 3],
    )
    earned, max_pts = score_question(q, [1])
    assert max_pts == 4.0
    assert earned == 2.0


def test_omitted_questions_count_in_max_score():
    """Faille #4 : omettre des questions ne doit pas gonfler le score relatif."""
    questions = {
        1: make_question(1, points=5.0, correct_ids=[1], option_ids=[1, 2]),
        2: make_question(2, points=5.0, correct_ids=[1], option_ids=[1, 2]),
    }
    total, max_total, normalized = score_exam_answers(questions, {1: [1]})
    assert total == 5.0
    assert max_total == 10.0
    assert normalized[1] == [1]
    assert normalized[2] == []


def test_true_false_scoring():
    q = make_question(
        1,
        points=1.0,
        question_type=QuestionType.TRUE_FALSE,
        correct_ids=[1],
        option_ids=[1, 2],
    )
    assert score_question(q, [1]) == (1.0, 1.0)
    assert score_question(q, [2]) == (0.0, 1.0)
