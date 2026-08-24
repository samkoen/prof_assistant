from app.models.enums import MultipleScoringMode, QuestionType
from app.models.exam import Question


def clamp_open_score(raw: float, max_points: float) -> float:
    return round(max(0.0, min(float(raw), float(max_points))), 2)


def _score_single(correct_ids: set[int], selected: set[int], max_points: float) -> tuple[float, float]:
    if selected == correct_ids and len(selected) == len(correct_ids):
        return max_points, max_points
    return 0.0, max_points


def _score_multiple(
    correct_ids: set[int],
    selected: set[int],
    max_points: float,
    mode: MultipleScoringMode,
) -> tuple[float, float]:
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


def score_question(
    question: Question,
    selected_option_ids: list[int],
    *,
    open_earned: float | None = None,
) -> tuple[float, float]:
    max_points = question.points
    if question.question_type == QuestionType.OPEN:
        if open_earned is None:
            return 0.0, max_points
        return clamp_open_score(open_earned, max_points), max_points

    correct_ids = {o.id for o in question.options if o.is_correct}
    selected = set(selected_option_ids)
    if question.question_type in (QuestionType.SINGLE, QuestionType.TRUE_FALSE):
        return _score_single(correct_ids, selected, max_points)
    mode = question.multiple_scoring_mode or MultipleScoringMode.PROPORTIONAL
    return _score_multiple(correct_ids, selected, max_points, mode)


def score_exam_answers(
    questions: dict[int, Question],
    selected_by_q: dict[int, list[int]],
    open_earned_by_q: dict[int, float] | None = None,
) -> tuple[float, float, dict[int, list[int]]]:
    """Note toutes les questions ; absentes = []. Retourne score, max, réponses normalisées."""
    open_earned = open_earned_by_q or {}
    total = 0.0
    max_total = 0.0
    normalized: dict[int, list[int]] = {}
    for qid, question in questions.items():
        selected = list(selected_by_q.get(qid, []))
        earned, max_pts = score_question(
            question, selected, open_earned=open_earned.get(qid)
        )
        total += earned
        max_total += max_pts
        normalized[qid] = selected
    return total, max_total, normalized
