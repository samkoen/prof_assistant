"""Prompts d'explication QCM localisés selon ai_explanation_language."""

from app.models.enums import QuestionType
from app.schemas.gemini_questions import GeminiSeriesLanguage
from app.services.gemini_text_cleanup import clean_gemini_user_text

ExplanationLanguage = GeminiSeriesLanguage

_TYPE_LABELS: dict[ExplanationLanguage, dict[QuestionType, str]] = {
    "he": {
        QuestionType.SINGLE: "בחירה יחידה",
        QuestionType.MULTIPLE: "בחירה מרובה",
        QuestionType.TRUE_FALSE: "נכון/לא נכון",
    },
    "fr": {
        QuestionType.SINGLE: "Choix unique",
        QuestionType.MULTIPLE: "Choix multiples",
        QuestionType.TRUE_FALSE: "Vrai/Faux",
    },
    "en": {
        QuestionType.SINGLE: "Single choice",
        QuestionType.MULTIPLE: "Multiple choice",
        QuestionType.TRUE_FALSE: "True/False",
    },
    "ru": {
        QuestionType.SINGLE: "Один ответ",
        QuestionType.MULTIPLE: "Несколько ответов",
        QuestionType.TRUE_FALSE: "Верно/Неверно",
    },
}

_PROMPT_COPY: dict[ExplanationLanguage, dict[str, str]] = {
    "he": {
        "intro": "אתה עוזר לימודי למבחן QCM.",
        "instruction": "ענה בעברית בלבד. אל תשתמש בשפות אחרות.",
        "rules": (
            "- הסבר למה התשובה(ות) הנכונה(ות) נכונה(ות), בצורה ברורה ומעודדת.\n"
            "- אם התלמיד טעה, הסבר בקצרה למה הבחירה שלו שגויה.\n"
            "- אל תמציא עובדות שלא מופיעות בשאלה או באפשרויות.\n"
            "- 6–10 משפטים לכל היותר."
        ),
        "question_type": "סוג שאלה",
        "question": "שאלה",
        "options": "אפשרויות",
        "correct": "תשובה נכונה",
        "student": "תשובת התלמיד",
        "write": "כתוב הסבר פדגוגי בעברית:",
        "no_answer": "לא נבחרה תשובה",
        "correct_mark": " (נכון)",
    },
    "fr": {
        "intro": "Tu es un assistant pedagogique pour un QCM.",
        "instruction": "Reponds UNIQUEMENT en francais. N'utilise pas l'hebreu ni d'autres langues.",
        "rules": (
            "- Explique pourquoi la ou les bonnes reponses sont correctes, clairement et avec bienveillance.\n"
            "- Si l'eleve s'est trompe, explique brievement pourquoi son choix est incorrect.\n"
            "- N'invente pas de faits absents de la question ou des options.\n"
            "- 6 a 10 phrases maximum."
        ),
        "question_type": "Type de question",
        "question": "Question",
        "options": "Options",
        "correct": "Bonne reponse",
        "student": "Reponse de l'eleve",
        "write": "Ecris une explication pedagogique en francais :",
        "no_answer": "Aucune reponse selectionnee",
        "correct_mark": " (correct)",
    },
    "en": {
        "intro": "You are a learning assistant for a multiple-choice exam.",
        "instruction": "Respond in English ONLY. Do not use Hebrew or other languages.",
        "rules": (
            "- Explain why the correct answer(s) are correct, clearly and encouragingly.\n"
            "- If the student was wrong, briefly explain why their choice was incorrect.\n"
            "- Do not invent facts not present in the question or options.\n"
            "- 6 to 10 sentences at most."
        ),
        "question_type": "Question type",
        "question": "Question",
        "options": "Options",
        "correct": "Correct answer",
        "student": "Student's answer",
        "write": "Write a pedagogical explanation in English:",
        "no_answer": "No answer selected",
        "correct_mark": " (correct)",
    },
    "ru": {
        "intro": "Ty pomoshchnik dlya testa s vyborom otveta (QCM).",
        "instruction": "Otvechay tolko na russkom yazyke. Ne ispolzuy ivrit ili drugie yazyki.",
        "rules": (
            "- Ob'yasni, pochemu pravilnye otvety verny, yasno i podderzhivayushche.\n"
            "- Esli uchenik oshibsya, kratko ob'yasni, pochemu ego vybor neveren.\n"
            "- Ne vymyshlyay fakty, kotorykh net v voprose ili variantakh.\n"
            "- Ne bolee 6–10 predlozheniy."
        ),
        "question_type": "Tip voprosa",
        "question": "Vopros",
        "options": "Varianty",
        "correct": "Pravilnyj otvet",
        "student": "Otvet uchenika",
        "write": "Napishi pedagogicheskoe ob'yasnenie na russkom:",
        "no_answer": "Otvet ne vybran",
        "correct_mark": " (verno)",
    },
}

_SYSTEM_BY_LANG: dict[ExplanationLanguage, str] = {
    "he": "עוזר לימודי ל-QCM. ענה בעברית בלבד. טקסט בלבד, ללא כלים.",
    "fr": "Assistant pedagogique QCM. Reponds UNIQUEMENT en francais. Texte seulement, sans outils.",
    "en": "Pedagogical QCM assistant. Respond in English ONLY. Text only, no tools.",
    "ru": "Pedagogicheskiy pomoshchnik QCM. Otvechay tolko na russkom. Tolko tekst, bez instrumentov.",
}


def explanation_system_prompt(language: ExplanationLanguage) -> str:
    return _SYSTEM_BY_LANG.get(language, _SYSTEM_BY_LANG["he"])


def _copy(language: ExplanationLanguage) -> dict[str, str]:
    return _PROMPT_COPY.get(language, _PROMPT_COPY["he"])


def _option_label(index: int) -> str:
    return chr(65 + index)


def _format_options(question, language: ExplanationLanguage) -> str:
    copy = _copy(language)
    lines: list[str] = []
    for idx, opt in enumerate(sorted(question.options, key=lambda o: o.order_index)):
        mark = copy["correct_mark"] if opt.is_correct else ""
        lines.append(f"{_option_label(idx)}) {opt.text.strip()}{mark}")
    return "\n".join(lines)


def _selected_labels(question, selected_ids: list[int], language: ExplanationLanguage) -> str:
    copy = _copy(language)
    if not selected_ids:
        return copy["no_answer"]
    ordered = sorted(question.options, key=lambda o: o.order_index)
    labels: list[str] = []
    for idx, opt in enumerate(ordered):
        if opt.id in selected_ids:
            labels.append(f"{_option_label(idx)}) {clean_gemini_user_text(opt.text)}")
    return ", ".join(labels) if labels else copy["no_answer"]


def build_explanation_prompt(question, selected_ids: list[int], language: ExplanationLanguage) -> str:
    copy = _copy(language)
    type_labels = _TYPE_LABELS.get(language, _TYPE_LABELS["he"])
    correct = sorted([o for o in question.options if o.is_correct], key=lambda o: o.order_index)
    correct_text = "; ".join(clean_gemini_user_text(o.text) for o in correct) or "—"
    type_label = type_labels.get(question.question_type, str(question.question_type))
    return f"""{copy["intro"]} {copy["instruction"]}

{copy["rules"]}

{copy["question_type"]}: {type_label}

{copy["question"]}:
{clean_gemini_user_text(question.text)}

{copy["options"]}:
{_format_options(question, language)}

{copy["correct"]}: {correct_text}

{copy["student"]}: {_selected_labels(question, selected_ids, language)}

{copy["write"]}"""
