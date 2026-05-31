import re

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
- אפשרויות: A) B) C) D) — אחרי A) מותרות שורות נוספות (למשל שרטוט עץ עם / ו- \\)
- סימון נכון: שורה עם * בלבד מיד אחרי A), או * בסוף השורה האחרונה של אותה אפשרות
- {cfg["tf"]}
- בחירה יחידה: בדיוק אפשרות אחת עם * (חובה — בלי * המערכת תדחה)
- בחירה מרובה: לפחות שתי אפשרויות, לפחות אחת עם *
- אל תוסיף הסברים, JSON או markdown — רק שאלות בפורמט זה
- אסור: א) ב) ג) — רק A) B) C) D); אסור * בתוך טקסט (רק כסימון נכון)"""

_TREE_TOPIC_RE = re.compile(
    r"avl|עץ|עצים|tree|הוספ|מחיק|insert|delete|/|\\",
    re.IGNORECASE,
)

_AVL_TREE_FORMAT = """
שרטוט עץ AVL — כללים מחייבים (בכל אפשרות עם עץ):
1) / = קשת לבן שמאל בלבד; \\ = קשת לבן ימין בלבד. אסור לצייר רק / כשיש גם ימין.
2) לכל צומת עם שני ילדים: שורת קשתות חייבת להכיל גם / וגם \\ (למשל "     /  \\" מתחת לשורש).
3) מספר השורש ממורכז מעל צומת ה-/\\; כל ערך ילד ממוקם ישירות מתחת לקשת שלו.
4) אסור לשים ילד ימני באותה שורה עם / בלי \\ מעליו. אסור "30\\n/\\n20 40" — זה שגוי.
5) עץ קטן (עד 4 רמות), רווחים ליישור — לא טאבים.

דוגמה נכונה (העתק מבנה זה):
      30
     /  \\
   20    40
  /       \\
10        50

דוגמה אסורה (לא ליצור):
  30
  /
 20  40

בפורמט QCM: A) ואז שורה * ואז שורות העץ; ב-single בדיוק אפשרות אחת עם *.
"""


def _series_needs_tree_hint(series: list[GeminiSeriesInput]) -> bool:
    return any(_TREE_TOPIC_RE.search(s.instructions) for s in series)


def _types_line(types: list[QuestionType]) -> str:
    return ", ".join(_TYPE_LABELS[t] for t in types)


def _series_block(index: int, item: GeminiSeriesInput) -> str:
    level = _LEVEL_LABELS[item.level]
    lang = _LANG_CONFIG[item.language]["label"]
    return (
        f"{index}. הנחיות המורה:\n{item.instructions.strip()}\n"
        f"   מספר שאלות: {item.question_count}\n"
        f"   רמה: {level}\n"
        f"   שפה: {lang}\n"
        f"   סוגי שאלות מותרים: {_types_line(item.question_types)}\n"
        f"   חלק את השאלות בין הסוגים המותרים בערך שווה."
    )


def build_questions_generation_prompt(
    series: list[GeminiSeriesInput],
    exam_title: str | None = None,
    sources_block: str = "",
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
    sources_part = f"\n{sources_block}\n" if sources_block.strip() else ""
    tree_hint = _AVL_TREE_FORMAT if _series_needs_tree_hint(series) else ""
    return f"""צור שאלות מבחן (QCM).
{sources_part}
{title_line}סה״כ {total} שאלות לפי הסדרות:

{blocks}

{format_rules}
{tree_hint}
התחל מיד עם --- ואז Q1 — ללא הקדמה."""
