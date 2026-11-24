from dataclasses import dataclass, field

from app.models.enums import MultipleScoringMode, QuestionType
from app.models.exam import Question


@dataclass(frozen=True)
class ScoringRules:
    """Règles de notation de l'examen : parties « N réponses comptées » et plafond de note."""

    required_by_section: dict[int, int] = field(default_factory=dict)
    score_cap: float | None = None


NO_RULES = ScoringRules()


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
    if question.question_type == QuestionType.SINGLE:
        return _score_single(correct_ids, selected, max_points)
    mode = question.multiple_scoring_mode or MultipleScoringMode.PROPORTIONAL
    return _score_multiple(correct_ids, selected, max_points, mode)


def answered_question_ids(
    questions: dict[int, Question],
    selected_by_q: dict[int, list[int]],
    text_by_q: dict[int, str | None] | None = None,
) -> set[int]:
    """Questions auxquelles l'élève a réellement répondu (option cochée ou texte non vide)."""
    texts = text_by_q or {}
    answered: set[int] = set()
    for qid, question in questions.items():
        if question.question_type == QuestionType.OPEN:
            if (texts.get(qid) or "").strip():
                answered.add(qid)
        elif selected_by_q.get(qid):
            answered.add(qid)
    return answered


def _choice_sections(
    questions: dict[int, Question], rules: ScoringRules
) -> dict[int, list[Question]]:
    """Parties où N < nombre de questions : questions triées dans l'ordre du professeur."""
    by_section: dict[int, list[Question]] = {}
    for question in questions.values():
        if question.section_id in rules.required_by_section:
            by_section.setdefault(question.section_id, []).append(question)
    out: dict[int, list[Question]] = {}
    for section_id, items in by_section.items():
        if 0 < rules.required_by_section[section_id] < len(items):
            out[section_id] = sorted(items, key=lambda q: (q.order_index, q.id))
    return out


def uncounted_question_ids(
    questions: dict[int, Question], answered: set[int], rules: ScoringRules
) -> set[int]:
    """Questions non notées : au-delà des N premières réponses, ou laissées vides dans une partie à choix."""
    skipped: set[int] = set()
    for section_id, items in _choice_sections(questions, rules).items():
        required = rules.required_by_section[section_id]
        kept = [q.id for q in items if q.id in answered][:required]
        skipped.update(q.id for q in items if q.id not in kept)
    return skipped


def exam_max_score(questions: dict[int, Question], rules: ScoringRules = NO_RULES) -> float:
    """Total possible : dans une partie à choix, seules les N questions les mieux dotées comptent."""
    choice = _choice_sections(questions, rules)
    in_choice = {q.id for items in choice.values() for q in items}
    total = sum(q.points for q in questions.values() if q.id not in in_choice)
    for section_id, items in choice.items():
        best = sorted((q.points for q in items), reverse=True)
        total += sum(best[: rules.required_by_section[section_id]])
    return apply_score_cap(total, rules)


def apply_score_cap(value: float, rules: ScoringRules) -> float:
    if rules.score_cap is None:
        return value
    return min(value, rules.score_cap)


def score_exam_answers(
    questions: dict[int, Question],
    selected_by_q: dict[int, list[int]],
    open_earned_by_q: dict[int, float] | None = None,
    *,
    rules: ScoringRules = NO_RULES,
    text_by_q: dict[int, str | None] | None = None,
) -> tuple[float, float, dict[int, list[int]]]:
    """Note toutes les questions ; absentes = []. Retourne score, max, réponses normalisées."""
    open_earned = open_earned_by_q or {}
    answered = answered_question_ids(questions, selected_by_q, text_by_q)
    skipped = uncounted_question_ids(questions, answered, rules)
    total = 0.0
    normalized: dict[int, list[int]] = {}
    for qid, question in questions.items():
        selected = list(selected_by_q.get(qid, []))
        normalized[qid] = selected
        if qid in skipped:
            continue
        earned, _max = score_question(question, selected, open_earned=open_earned.get(qid))
        total += earned
    return apply_score_cap(total, rules), exam_max_score(questions, rules), normalized
