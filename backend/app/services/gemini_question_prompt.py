from app.models.enums import QuestionType
from app.schemas.gemini_questions import GeminiSeriesInput, GeminiSeriesLanguage

_LEVEL_LABELS = {"easy": "קל", "medium": "בינוני", "hard": "קשה"}
_TYPE_LABELS = {
    QuestionType.SINGLE: "בחירה יחידה (single)",
    QuestionType.MULTIPLE: "בחירה מרובה (multiple)",
    QuestionType.TRUE_FALSE: "נכון/לא נכון (true_false)",
}

_LANG_CONFIG: dict[GeminiSeriesLanguage, dict[str, str]] = {
    "he": {
        "label": "עברית",
        "write": "כתוב את כל השאלות, האפשרויות ותשובות הנכון/לא נכון בעברית.",
        "tf": 'ל-true_false: שורות "נכון" / "לא נכון" עם * על הנכונה',
    },
    "fr": {
        "label": "français",
        "write": "Écris toutes les questions, options et paires vrai/faux en français.",
        "tf": 'Pour true_false: lignes "Vrai" / "Faux" avec * sur la bonne réponse',
    },
    "en": {
        "label": "English",
        "write": "Write all questions, options, and true/false lines in English.",
        "tf": 'For true_false: lines "True" / "False" with * on the correct one',
    },
    "ru": {
        "label": "русский",
        "write": "Пиши все вопросы, варианты и пары верно/неверно на русском языке.",
        "tf": 'Для true_false: строки "Верно" / "Неверно" с * у правильного ответа',
    },
}


def _format_rules(lang: GeminiSeriesLanguage) -> str:
    cfg = _LANG_CONFIG[lang]
    return f"""פורמט חובה:
- הפרד בין שאלות בשורה --- בלבד
- כותרת: Q<num> [single|multiple|true_false] (1 pt) — מספר רץ גלובלי
- {cfg["write"]}
- אפשרויות: A) B) C) D) — * בסוף השורה של התשובה הנכונה
- {cfg["tf"]}
- בחירה יחידה: בדיוק תשובה נכונה אחת עם *
- בחירה מרובה: לפחות שתי אפשרויות, לפחות אחת עם *
- אל תוסיף הסברים, JSON או markdown — רק שאלות בפורמט זה"""


def _types_line(types: list[QuestionType]) -> str:
    return ", ".join(_TYPE_LABELS[t] for t in types)


def _series_block(index: int, item: GeminiSeriesInput) -> str:
    level = _LEVEL_LABELS[item.level]
    lang = _LANG_CONFIG[item.language]["label"]
    return (
        f"{index}. נושא: {item.subject.strip()}\n"
        f"   מספר שאלות: {item.question_count}\n"
        f"   רמה: {level}\n"
        f"   שפה: {lang}\n"
        f"   סוגי שאלות מותרים: {_types_line(item.question_types)}\n"
        f"   חלק את השאלות בין הסוגים המותרים בערך שווה."
    )


def build_questions_generation_prompt(
    series: list[GeminiSeriesInput],
    exam_title: str | None = None,
) -> str:
    total = sum(s.question_count for s in series)
    title_line = f"מבחן: {exam_title.strip()}\n" if exam_title and exam_title.strip() else ""
    blocks = "\n".join(_series_block(i + 1, s) for i, s in enumerate(series))
    languages = sorted({s.language for s in series})
    if len(languages) == 1:
        format_rules = _format_rules(languages[0])
    else:
        per_lang = "\n\n".join(_format_rules(lang) for lang in languages)
        format_rules = f"לכל סדרה — השתמש בשפת הסדרה:\n\n{per_lang}"
    return f"""צור שאלות מבחן (QCM).

{title_line}סה״כ {total} שאלות לפי הסדרות:

{blocks}

{format_rules}

התחל מיד עם --- ואז Q1 — ללא הקדמה."""
