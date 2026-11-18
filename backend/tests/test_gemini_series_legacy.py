from app.models.enums import QuestionType
from app.schemas.gemini_questions import GeminiSeriesInput


def _saved_series(types: list[str]) -> dict:
    return {"instructions": "x", "question_count": 3, "level": "easy", "question_types": types, "language": "he"}


def test_saved_true_false_series_is_read_as_single():
    series = GeminiSeriesInput.model_validate(_saved_series(["true_false", "open"]))
    assert series.question_types == [QuestionType.SINGLE, QuestionType.OPEN]


def test_true_false_and_single_do_not_duplicate():
    series = GeminiSeriesInput.model_validate(_saved_series(["single", "true_false"]))
    assert series.question_types == [QuestionType.SINGLE]
