from fastapi import HTTPException
import pytest
from types import SimpleNamespace
from unittest.mock import AsyncMock

from app.models.enums import QuestionType
from app.schemas.exam import QuestionCreate
from app.services.exam_questions import validate_question_body
from app.services import open_answer_evaluation as open_eval_mod
from app.services.open_answer_evaluation import attempt_score_lock_stmt
from app.services.open_answer_parse import parse_open_evaluation_json
from app.services.open_answer_prompt import build_evaluation_prompt, evaluation_system_prompt
from app.services.open_answer_text import looks_latin_transliteration, strip_foreign_scripts
from app.services.scoring import clamp_open_score, score_exam_answers, score_question
from tests.helpers import make_question


def test_attempt_score_lock_stmt_uses_for_update():
    from sqlalchemy.dialects import postgresql

    sql = str(attempt_score_lock_stmt(42).compile(dialect=postgresql.dialect()))
    assert "FOR UPDATE" in sql
    assert "student_exam_attempts" in sql.lower()


def _async_track(order: list[str], name: str, result):
    async def inner(*_args, **_kwargs):
        order.append(name)
        return result

    return inner


async def test_persist_eval_locks_before_rescore(monkeypatch):
    order: list[str] = []
    locked = SimpleNamespace(id=1, score=None, max_score=None)
    question = SimpleNamespace(id=10, exam_id=99)
    monkeypatch.setattr(open_eval_mod, "_lock_attempt_for_rescore", _async_track(order, "lock", locked))
    monkeypatch.setattr(open_eval_mod, "_upsert_evaluation", _async_track(order, "upsert", SimpleNamespace()))
    monkeypatch.setattr(
        open_eval_mod, "recalculate_attempt_score", _async_track(order, "recalc", (1.0, 2.0))
    )
    db = SimpleNamespace(flush=AsyncMock(), commit=AsyncMock())
    attempt, _row = await open_eval_mod._persist_eval_and_rescore(
        1, question, "he", "ok", 1.0, db, for_practice=False
    )
    assert order == ["lock", "upsert", "recalc"]
    assert attempt is locked
    db.flush.assert_awaited_once()
    db.commit.assert_awaited_once()


def test_open_question_unscored_until_evaluation():
    q = make_question(1, points=3.0, question_type=QuestionType.OPEN, option_ids=[])
    assert score_question(q, []) == (0.0, 3.0)
    assert score_question(q, [], open_earned=2.5) == (2.5, 3.0)


def test_open_score_is_clamped():
    q = make_question(1, points=2.0, question_type=QuestionType.OPEN, option_ids=[])
    assert score_question(q, [], open_earned=9) == (2.0, 2.0)
    assert score_question(q, [], open_earned=-1) == (0.0, 2.0)
    assert clamp_open_score(1.234, 2) == 1.23


def test_mixed_exam_open_counts_in_max():
    questions = {
        1: make_question(1, points=5.0, correct_ids=[1], option_ids=[1, 2]),
        2: make_question(2, points=5.0, question_type=QuestionType.OPEN, option_ids=[]),
    }
    total, max_total, _ = score_exam_answers(questions, {1: [1]})
    assert total == 5.0
    assert max_total == 10.0
    total2, _, _ = score_exam_answers(questions, {1: [1]}, {2: 4.0})
    assert total2 == 9.0


def test_validate_open_question_without_options():
    body = QuestionCreate(text="הסבירו חיפוש בינארי", question_type=QuestionType.OPEN)
    validate_question_body(body, 0)


def test_validate_open_question_requires_content():
    body = QuestionCreate(text="  ", question_type=QuestionType.OPEN)
    with pytest.raises(HTTPException) as exc:
        validate_question_body(body, 0)
    assert exc.value.status_code == 400


def test_parse_open_evaluation_json_fenced():
    raw = """```json
{"appreciation": "טוב", "score": 1.5, "model_answer": "O(log n)"}
```"""
    parsed = parse_open_evaluation_json(raw)
    assert parsed.appreciation == "טוב"
    assert parsed.score == 1.5
    assert parsed.model_answer == "O(log n)"


def test_parse_open_evaluation_json_rejects_empty():
    with pytest.raises(ValueError):
        parse_open_evaluation_json("")
    with pytest.raises(ValueError):
        parse_open_evaluation_json('{"score": 1}')


def test_strip_cjk_and_cyrillic_from_hebrew():
    raw = "גישה因енияdue לגישה מבליイメץWrapping"
    cleaned = strip_foreign_scripts(raw, "he")
    assert "因" not in cleaned
    assert "ения" not in cleaned
    assert "イメ" not in cleaned
    assert "גישה" in cleaned
    assert "Wrapping" in cleaned


def test_detects_latin_transliteration_tail():
    mixed = (
        "ההבדל העיקרי הוא שגודל המערך קבוע. "
        "zlila bshvil shehigata l'ikar hadavar kol hakavod "
        "stam chasar lekha duga konkretit k'matai tavor."
    )
    assert looks_latin_transliteration(mixed)
    hebrew_ok = "הגעת לעיקר. אפשר להשתמש ב-ArrayList וב-int[]. הוסף דוגמה."
    assert not looks_latin_transliteration(hebrew_ok)


def test_hebrew_evaluation_prompt_is_english_with_hebrew_output():
    question = "מה ההבדל בין מערך ל-ArrayList?"
    student = "מערך קבוע, ArrayList דינמי"
    prompt = build_evaluation_prompt(
        question,
        student,
        2.0,
        "he",
        model_answer=None,
    )
    assert "Grade this open exam answer" in prompt
    assert "Hebrew letters" in prompt
    assert "zlila" in prompt
    assert question in prompt
    assert student in prompt
    assert "הגעת לעיקר" in prompt
    system = evaluation_system_prompt("he", strict=True)
    assert "kol hakavod" in system
    assert "grade open exam answers" in evaluation_system_prompt("he").lower()
