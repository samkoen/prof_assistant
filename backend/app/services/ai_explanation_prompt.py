"""Prompts d'explication QCM — consignes en anglais, sortie dans la langue demandée."""

from app.models.enums import QuestionType
from app.schemas.gemini_questions import GeminiSeriesLanguage
from app.services.ai_output_language import output_language_rule
from app.services.ai_prompt_render import render_prompt
from app.services.ai_prompt_store import get_prompt_body
from app.services.gemini_text_cleanup import clean_gemini_user_text

ExplanationLanguage = GeminiSeriesLanguage

_TYPE_LABELS: dict[QuestionType, str] = {
    QuestionType.SINGLE: "single choice",
    QuestionType.MULTIPLE: "multiple choice",
    QuestionType.TRUE_FALSE: "true/false",
    QuestionType.OPEN: "open question",
}


def explanation_system_prompt(language: ExplanationLanguage) -> str:
    return render_prompt(
        get_prompt_body("explanation.system"),
        {"language_rule": output_language_rule(language)},
    )


def _option_label(index: int) -> str:
    return chr(65 + index)


def _format_options(question) -> str:
    lines: list[str] = []
    for idx, opt in enumerate(sorted(question.options, key=lambda o: o.order_index)):
        mark = " (correct)" if opt.is_correct else ""
        lines.append(f"{_option_label(idx)}) {opt.text.strip()}{mark}")
    return "\n".join(lines)


def _selected_labels(question, selected_ids: list[int]) -> str:
    if not selected_ids:
        return "No answer selected"
    ordered = sorted(question.options, key=lambda o: o.order_index)
    labels: list[str] = []
    for idx, opt in enumerate(ordered):
        if opt.id in selected_ids:
            labels.append(f"{_option_label(idx)}) {clean_gemini_user_text(opt.text)}")
    return ", ".join(labels) if labels else "No answer selected"


def build_explanation_prompt(question, selected_ids: list[int], language: ExplanationLanguage) -> str:
    correct = sorted([o for o in question.options if o.is_correct], key=lambda o: o.order_index)
    correct_text = "; ".join(clean_gemini_user_text(o.text) for o in correct) or "—"
    type_label = _TYPE_LABELS.get(question.question_type, str(question.question_type))
    return render_prompt(
        get_prompt_body("explanation.user"),
        {
            "language_rule": output_language_rule(language),
            "type_label": type_label,
            "question": clean_gemini_user_text(question.text),
            "options": _format_options(question),
            "correct": correct_text,
            "student": _selected_labels(question, selected_ids),
        },
    )
