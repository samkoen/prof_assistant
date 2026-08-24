"""Prompts d'évaluation des questions ouvertes — consignes en anglais."""

from app.schemas.gemini_questions import GeminiSeriesLanguage
from app.services.ai_output_language import output_language_rule
from app.services.ai_prompt_render import render_prompt
from app.services.ai_prompt_store import get_prompt_body
from app.services.gemini_text_cleanup import clean_gemini_user_text


def evaluation_system_prompt(language: GeminiSeriesLanguage, *, strict: bool = False) -> str:
    base = render_prompt(
        get_prompt_body("open_eval.system"),
        {"language_rule": output_language_rule(language)},
    )
    if strict and language == "he":
        return f"{base} {get_prompt_body('open_eval.strict_he')}"
    return base


def model_answer_system_prompt(language: GeminiSeriesLanguage) -> str:
    return render_prompt(
        get_prompt_body("open_model.system"),
        {"language_rule": output_language_rule(language)},
    )


def build_model_answer_prompt(question_text: str, language: GeminiSeriesLanguage) -> str:
    q = clean_gemini_user_text(question_text)
    return render_prompt(
        get_prompt_body("open_model.user"),
        {"language_rule": output_language_rule(language), "question": q},
    )


def _model_block(model_answer: str | None) -> str:
    if model_answer:
        text = clean_gemini_user_text(model_answer)
        return f"Model answer (authoritative, do not change it):\n{text}\n"
    return "No model answer yet — also provide one in model_answer.\n"


def _json_example(language: GeminiSeriesLanguage) -> str:
    if language == "he":
        return '{"appreciation":"הגעת לעיקר. הוסף דוגמה קונקרטית.","score":0,"model_answer":"..."}'
    return '{"appreciation": "...", "score": 0, "model_answer": "..."}'


def build_evaluation_prompt(
    question_text: str,
    student_answer: str,
    max_points: float,
    language: GeminiSeriesLanguage,
    *,
    model_answer: str | None,
    strict: bool = False,
) -> str:
    q = clean_gemini_user_text(question_text)
    student = clean_gemini_user_text(student_answer) or "(empty)"
    strict_line = ""
    if strict and language == "he":
        strict_line = f"{get_prompt_body('open_eval.strict_he')}\n"
    return render_prompt(
        get_prompt_body("open_eval.user"),
        {
            "strict_line": strict_line,
            "language_rule": output_language_rule(language),
            "max_points": f"{max_points:g}",
            "question": q,
            "model_block": _model_block(model_answer),
            "student": student,
            "json_example": _json_example(language),
        },
    )
