"""Notation des parties « répondre à N questions sur M » et plafond de note."""

import random
from types import SimpleNamespace

from app.models.enums import QuestionType
from app.services.exam_sections import group_questions_by_section, paper_order, scoring_rules
from app.services.scoring import (
    ScoringRules,
    answered_question_ids,
    exam_max_score,
    score_exam_answers,
    uncounted_question_ids,
)
from tests.helpers import make_question

PART_B = 2


def _midterm() -> dict:
    """Sujet type : 1 question ouverte de 60 points + 7 QCM de 7 points dont 6 comptent."""
    questions = {
        1: make_question(1, points=60, question_type=QuestionType.OPEN, section_id=1),
    }
    for qid in range(2, 9):
        questions[qid] = make_question(qid, points=7, correct_ids=[1], section_id=PART_B)
    return questions


RULES = ScoringRules(required_by_section={PART_B: 6}, score_cap=100)


def test_max_score_counts_only_required_questions_and_applies_cap():
    questions = _midterm()
    assert exam_max_score(questions, ScoringRules(required_by_section={PART_B: 6})) == 102
    assert exam_max_score(questions, RULES) == 100


def test_six_correct_answers_out_of_seven_give_full_part():
    questions = _midterm()
    selected = {qid: [1] for qid in range(2, 8)}
    total, max_total, _ = score_exam_answers(
        questions, selected, {1: 60}, rules=RULES, text_by_q={1: "int series(int n)"}
    )
    assert (total, max_total) == (100, 100)


def test_seventh_answer_is_ignored_even_when_correct():
    questions = _midterm()
    selected = {qid: [2] for qid in range(2, 8)}
    selected[8] = [1]
    total, _max, _ = score_exam_answers(questions, selected, rules=RULES)
    assert total == 0
    skipped = uncounted_question_ids(questions, set(range(2, 9)), RULES)
    assert skipped == {8}


def test_skipped_question_frees_a_slot_for_a_later_one():
    questions = _midterm()
    selected = {qid: [1] for qid in (2, 3, 4, 5, 6, 8)}
    total, _max, _ = score_exam_answers(questions, selected, rules=RULES)
    assert total == 42
    assert uncounted_question_ids(questions, set(selected), RULES) == {7}


def test_open_answer_counts_as_answered_only_with_text():
    questions = {
        1: make_question(1, points=5, question_type=QuestionType.OPEN, section_id=PART_B),
        2: make_question(2, points=5, question_type=QuestionType.OPEN, section_id=PART_B),
    }
    answered = answered_question_ids(questions, {}, {1: "   ", 2: "תשובה"})
    assert answered == {2}
    rules = ScoringRules(required_by_section={PART_B: 1})
    total, max_total, _ = score_exam_answers(
        questions, {}, {1: 5, 2: 3}, rules=rules, text_by_q={1: "", 2: "תשובה"}
    )
    assert (total, max_total) == (3, 5)


def test_required_count_not_below_question_count_changes_nothing():
    questions = _midterm()
    rules = ScoringRules(required_by_section={PART_B: 7})
    selected = {qid: [1] for qid in range(2, 9)}
    total, max_total, _ = score_exam_answers(questions, selected, rules=rules)
    assert (total, max_total) == (49, 109)


def test_exam_without_rules_keeps_previous_totals():
    questions = {1: make_question(1, points=2, correct_ids=[1]), 2: make_question(2, points=3, correct_ids=[2])}
    total, max_total, normalized = score_exam_answers(questions, {1: [1]})
    assert (total, max_total) == (2, 5)
    assert normalized == {1: [1], 2: []}


def _section(section_id: int, order_index: int, required: int | None = None):
    return SimpleNamespace(id=section_id, order_index=order_index, required_count=required)


def test_scoring_rules_ignore_sections_without_required_count():
    exam = SimpleNamespace(score_cap=100)
    rules = scoring_rules(exam, [_section(1, 0), _section(PART_B, 1, 6)])
    assert rules == RULES


def test_questions_are_grouped_by_section_with_loose_ones_first():
    questions = [
        make_question(1, section_id=PART_B),
        make_question(2, section_id=None),
        make_question(3, section_id=1),
    ]
    groups = group_questions_by_section(questions, [_section(1, 0), _section(PART_B, 1)])
    assert [[q.id for q in group] for group in groups] == [[2], [3], [1]]


def test_shuffle_never_moves_a_question_out_of_its_section():
    questions = list(_midterm().values())
    sections = [_section(1, 0), _section(PART_B, 1, 6)]
    for seed in range(20):
        ordered = paper_order(questions, sections, random.Random(seed), shuffle=True)
        assert ordered[0].id == 1
        assert sorted(q.id for q in ordered[1:]) == list(range(2, 9))


def test_paper_order_without_sections_matches_plain_shuffle():
    questions = [make_question(qid) for qid in range(1, 9)]
    expected = list(questions)
    random.Random(7).shuffle(expected)
    ordered = paper_order(questions, [], random.Random(7), shuffle=True)
    assert [q.id for q in ordered] == [q.id for q in expected]
