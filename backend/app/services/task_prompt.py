"""Prompts de vérification d'une sous-tâche — consignes en anglais, fichier joint à part."""

from app.schemas.gemini_questions import GeminiSeriesLanguage
from app.services.ai_output_language import output_language_rule
from app.services.ai_prompt_render import render_prompt
from app.services.ai_prompt_store import get_prompt_body
from app.services.gemini_text_cleanup import clean_gemini_user_text


def task_system_prompt(language: GeminiSeriesLanguage) -> str:
    return render_prompt(
        get_prompt_body("task_verify.system"),
        {"language_rule": output_language_rule(language)},
    )


def task_user_prompt(title: str, instructions: str, max_points: float, language: GeminiSeriesLanguage) -> str:
    return render_prompt(
        get_prompt_body("task_verify.user"),
        {
            "language_rule": output_language_rule(language),
            "title": clean_gemini_user_text(title),
            "instructions": clean_gemini_user_text(instructions),
            "max_points": max_points,
        },
    )
