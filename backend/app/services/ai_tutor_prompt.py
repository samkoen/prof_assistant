"""Prompts du tuteur IA - consignes en anglais, réponses dans la langue de l'élève."""

from typing import Literal

from app.models.enums import QuestionType
from app.services.ai_explanation_prompt import _TYPE_LABELS, _format_options, _selected_labels
from app.services.ai_output_language import output_language_rule
from app.services.ai_prompt_render import render_prompt
from app.services.ai_prompt_store import get_prompt_body
from app.services.ai_tutor_access import TutorContext
from app.services.gemini_text_cleanup import clean_gemini_user_text

TutorAction = Literal[
    "why_wrong", "why_right", "step_by_step", "similar_example", "quiz_me", "full_explanation"
]

# Consigne ajoutée au tour envoyé au modèle ; l'historique garde le libellé vu par l'élève.
ACTION_HINTS: dict[str, str] = {
    "why_wrong": "The student asks why their answer is wrong. Start from their reasoning (Socratic).",
    "why_right": "The student got it right and wants to be sure they understand why. Check their reasoning.",
    "step_by_step": "Walk through the solution step by step, one short step per reply, checking understanding.",
    "similar_example": "Give ONE similar worked example, then ask if it is clear.",
    "quiz_me": "Ask ONE new similar question (with options if relevant). Do not reveal the answer until they reply.",
    "full_explanation": "The student asks for the full explanation now: give it completely and directly.",
}


def is_answer_correct(ctx: TutorContext) -> bool | None:
    """None pour une question ouverte (notée à part)."""
    if ctx.question.question_type == QuestionType.OPEN:
        return None
    correct = {o.id for o in ctx.question.options if o.is_correct}
    return bool(ctx.selected_ids) and set(ctx.selected_ids) == correct


def _result_label(ctx: TutorContext) -> str:
    verdict = is_answer_correct(ctx)
    if verdict is None:
        return "open question (graded separately)"
    return "correct" if verdict else "incorrect"


def _answer_fields(ctx: TutorContext) -> dict[str, str]:
    q = ctx.question
    if q.question_type == QuestionType.OPEN:
        student = clean_gemini_user_text(ctx.text_answer or "") or "No answer"
        return {"options": "-", "correct": clean_gemini_user_text(q.model_answer or "") or "-", "student": student}
    correct = sorted((o for o in q.options if o.is_correct), key=lambda o: o.order_index)
    return {
        "options": _format_options(q),
        "correct": "; ".join(clean_gemini_user_text(o.text) for o in correct) or "-",
        "student": _selected_labels(q, ctx.selected_ids),
    }


def _notes_block(ctx: TutorContext) -> str:
    notes = (ctx.question.ai_notes or "").strip()
    if not notes:
        return ""
    return f"\nNotes from the answer-key check (letters refer to the option order inside these notes):\n{notes}\n"


def build_tutor_context(ctx: TutorContext) -> str:
    catalog = getattr(ctx.exam, "catalog_course", None)
    return render_prompt(
        get_prompt_body("tutor.context"),
        {
            "course": getattr(catalog, "name", "") or ctx.exam.title,
            "type_label": _TYPE_LABELS.get(ctx.question.question_type, str(ctx.question.question_type)),
            "question": clean_gemini_user_text(ctx.question.text),
            "result": _result_label(ctx),
            "notes_block": _notes_block(ctx),
            **_answer_fields(ctx),
        },
    )


def tutor_system_prompt(ctx: TutorContext, language: str) -> str:
    return render_prompt(
        get_prompt_body("tutor.system"),
        {"language_rule": output_language_rule(language), "context": build_tutor_context(ctx)},
    )


def model_turn_text(text: str, action: str | None) -> str:
    hint = ACTION_HINTS.get(action or "")
    return f"{text}\n\n[{hint}]" if hint else text


def build_contents(history: list[tuple[str, str]], text: str, action: str | None) -> list[dict]:
    """history = [(role, content)] déjà échangés ; ajoute le nouveau message de l'élève."""
    contents = [
        {"role": "model" if role == "model" else "user", "parts": [{"text": content}]}
        for role, content in history
    ]
    contents.append({"role": "user", "parts": [{"text": model_turn_text(text, action)}]})
    return contents
