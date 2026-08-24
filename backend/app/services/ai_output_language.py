"""Règles de langue de sortie — consignes toujours en anglais."""

from app.schemas.gemini_questions import GeminiSeriesLanguage
from app.services.ai_prompt_store import get_prompt_body

_NAMES: dict[GeminiSeriesLanguage, str] = {
    "he": "Hebrew",
    "fr": "French",
    "en": "English",
    "ru": "Russian",
}


def output_language_name(language: GeminiSeriesLanguage) -> str:
    return _NAMES.get(language, "Hebrew")


def output_language_rule(language: GeminiSeriesLanguage) -> str:
    return get_prompt_body(f"output_language.{language}")
