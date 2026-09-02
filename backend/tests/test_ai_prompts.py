from types import SimpleNamespace

from app.models.enums import QuestionType
from app.schemas.gemini_questions import GeminiSeriesInput
from app.services.ai_explanation_prompt import build_explanation_prompt, explanation_system_prompt
from app.services.gemini_question_prompt import (
    REFINE_USER_MARKER,
    build_questions_generation_prompt,
    build_refine_user_message,
    is_generation_prompt,
    is_refine_prompt,
)
from app.services.open_answer_prompt import build_model_answer_prompt, model_answer_system_prompt


def _he_series() -> GeminiSeriesInput:
    return GeminiSeriesInput(
        instructions="מבני נתונים: מערך מול ArrayList",
        question_count=3,
        level="easy",
        question_types=[QuestionType.SINGLE],
        language="he",
    )


def test_generation_prompt_english_keeps_teacher_hebrew():
    series = [_he_series()]
    prompt = build_questions_generation_prompt(series, exam_title="מבחן פייתון")
    assert "Generate exam questions." in prompt
    assert "מבני נתונים: מערך מול ArrayList" in prompt
    assert "מבחן פייתון" in prompt
    assert "Hebrew letters" in prompt
    assert "צור שאלות מבחן" not in prompt
    assert is_generation_prompt(prompt)
    assert "For open questions: question text only, no A) B)" in prompt


def test_refine_prompt_english_keeps_teacher_message():
    teacher = "תוסיף שאלה על עצים"
    msg = build_refine_user_message(teacher, [_he_series()])
    assert REFINE_USER_MARKER in msg
    assert teacher in msg
    assert "Return the full question set" in msg
    assert "Open questions ([open]): question text only, no A) B)" in msg
    assert is_refine_prompt(msg)
    assert is_refine_prompt("בקשת עדכון מהמורה:\nold")
    assert is_generation_prompt("צור שאלות מבחן\nQ1")


def test_explanation_prompt_english_keeps_question_hebrew():
    question = SimpleNamespace(
        text="מהו Array?",
        question_type=QuestionType.SINGLE,
        options=[
            SimpleNamespace(id=1, text="רשימה דינמית", is_correct=False, order_index=0),
            SimpleNamespace(id=2, text="מערך", is_correct=True, order_index=1),
        ],
    )
    prompt = build_explanation_prompt(question, [1], "he")
    assert "Write the explanation in" in prompt
    assert "Hebrew letters" in prompt
    assert "מהו Array?" in prompt
    assert "רשימה דינמית" in prompt
    assert "ענה בעברית" not in prompt
    system = explanation_system_prompt("he")
    assert "Hebrew letters" in system


def test_model_answer_prompt_english_keeps_question():
    q = "הסבירו את ההבדל בין מערך ל-ArrayList"
    prompt = build_model_answer_prompt(q, "he")
    assert "Write the correct model answer" in prompt
    assert q in prompt
    assert "כתוב את התשובה" not in prompt


def test_model_answer_system_prompt_is_text_not_json_eval():
    system = model_answer_system_prompt("he")
    assert "no JSON" in system
    assert "JSON only" not in system
    assert "grade open exam answers" not in system.lower()
    assert "Hebrew letters" in system
