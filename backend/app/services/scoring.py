from app.models.enums import MultipleScoringMode, QuestionType
from app.models.exam import Question


def score_question(question: Question, selected_option_ids: list[int]) -> tuple[float, float]:
    correct_ids = {o.id for o in question.options if o.is_correct}
    selected = set(selected_option_ids)
    max_points = question.points

    if question.question_type == QuestionType.TRUE_FALSE:
        mode = MultipleScoringMode.ALL_OR_NOTHING
    else:
        mode = question.multiple_scoring_mode or MultipleScoringMode.PROPORTIONAL

    if question.question_type in (QuestionType.SINGLE, QuestionType.TRUE_FALSE):
        if selected == correct_ids and len(selected) == len(correct_ids):
            return max_points, max_points
        return 0.0, max_points

    if mode == MultipleScoringMode.ALL_OR_NOTHING:
        if selected == correct_ids:
            return max_points, max_points
        return 0.0, max_points

    if not correct_ids:
        return 0.0, max_points
    correct_selected = len(selected & correct_ids)
    wrong_selected = len(selected - correct_ids)
    raw = max(0.0, correct_selected - wrong_selected)
    earned = (raw / len(correct_ids)) * max_points
    return earned, max_points


def score_exam_answers(
    questions: dict[int, Question],
    selected_by_q: dict[int, list[int]],
) -> tuple[float, float, dict[int, list[int]]]:
    """Note toutes les questions ; absentes = []. Retourne score, max, réponses normalisées."""
    total = 0.0
    max_total = 0.0
    normalized: dict[int, list[int]] = {}
    for qid, question in questions.items():
        selected = list(selected_by_q.get(qid, []))
        earned, max_pts = score_question(question, selected)
        total += earned
        max_total += max_pts
        normalized[qid] = selected
    return total, max_total, normalized
