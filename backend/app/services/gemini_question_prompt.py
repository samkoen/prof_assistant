import re

from app.models.enums import QuestionType
from app.schemas.gemini_questions import GeminiSeriesInput, GeminiSeriesLanguage
from app.services.gemini_text_cleanup import clean_gemini_user_text

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

_TREE_TOPIC_RE = re.compile(
    r"avl|"
    r"עץ|עצים|"
    r"\btree\b|binary\s*tree|b[- ]?tree|"
    r"עץ\s*(avl|בינאר|חיפוש|מאוזן)|"
    r"הוספ(?:ה|ת).*עץ|מחיק(?:ה|ת).*עץ|"
    r"מבנה\s*נתונים.*עץ",
    re.IGNORECASE,
)

_AVL_TREE_FORMAT = """
שרטוט עץ AVL — כללים מחייבים (בכל אפשרות עם עץ):
1) עטוף את כל השרטוט ב-``` (שורה ``` לפני ואחרי) — חובה.
2) / = קשת לבן שמאל בלבד; \\ = קשת לבן ימין בלבד. אסור לצייר רק / כשיש גם ימין.
3) לכל צומת עם שני ילדים: שורת קשתות חייבת להכיל גם / וגם \\ (למשל "     /  \\" מתחת לשורש).
4) כל ערך חייב להיות מחובר: לכל ילד חייבת להיות קשת / או \\ מהורה. אסור ערך «תלוי» (למשל 35 בלי \\ מתחת ל-40).
5) מספר השורש ממורכז מעל צומת ה-/\\; כל ערך ילד ממוקם ישירות מתחת לקשת שלו.
6) עץ קטן (עד 4 רמות), רווחים ליישור — לא טאבים.

דוגמה נכונה (העתק מבנה זה):
B)
*
```
      30
     /  \\
   20    40
  /       \\
10        35
```

דוגמה אסורה (לא ליצור):
  30
  /
 20  40
(ללא ``` וללא \\ ל-35)

בפורמט QCM: A) או B) ואז שורה * ואז ``` ועץ ו-``` ; ב-single בדיוק אפשרות אחת עם *.
"""


def series_needs_tree_hint(series: list[GeminiSeriesInput]) -> bool:
    return any(_TREE_TOPIC_RE.search(s.instructions) for s in series)


def _format_rules(lang: GeminiSeriesLanguage, *, include_tree: bool) -> str:
    cfg = _LANG_CONFIG[lang]
    tree_rules = ""
    if include_tree:
        tree_rules = """
- אחרי A) מותרות שורות נוספות (שרטוט עץ, טבלה ASCII וכו')
- שרטוט ASCII (עץ AVL, מבנה נתונים): חובה לעטוף ב-``` לפני ואחרי השרטוט (שורות נפרדות), בתוך האפשרות — לא מחוץ ל-A) B)
- דוגמה בחירה יחידה עם עץ:
  B)
  *
  ```
      30
     /  \\
   20    40
        \\
       35
  ```
"""
    markdown_rule = (
        "- markdown: מותר ``` סביב שרטוט ASCII; גם **מודגש**, *נטוי*, `קוד`, רשימות עם -"
        if include_tree
        else "- markdown: מותר ``` לקוד; גם **מודגש**, *נטוי*, `קוד`, רשימות עם -"
    )
    return f"""פורמט חובה:
- הפרד בין שאלות בשורה --- בלבד
- כותרת: Q<num> [single|multiple|true_false] (1 pt) — מספר רץ גלובלי
- {cfg["write"]}
- אפשרויות: A) B) C) D)
{tree_rules}- סימון נכון (חובה): שורה * בלבד מיד אחרי A), או A) * ואז טקסט, או * בסוף שורת התשובה — לא לכתוב «לא נכון» כסימון (רק * או ✓)
- דוגמה בחירה יחידה (טקסט רגיל):
  A)
  *
  טקסט האפשרות הנכונה
  C) אפשרות שגויה
- {cfg["tf"]}
- בחירה יחידה: בדיוק אפשרות אחת עם * (חובה — בלי * המערכת תדחה)
- בחירה מרובה: לפחות שתי אפשרויות, לפחות אחת עם *
- {markdown_rule}
- אסור: א) ב) ג) — רק A) B) C) D); אסור * בתוך טקסט (רק כסימון נכון)"""


def _types_line(types: list[QuestionType]) -> str:
    return ", ".join(_TYPE_LABELS[t] for t in types)


def build_mandatory_topic_block(series: list[GeminiSeriesInput]) -> str:
    parts = [clean_gemini_user_text(s.instructions) for s in series if s.instructions.strip()]
    combined = " | ".join(parts)
    return f"הנושא מחייב: {combined}. מקורות = עזר בלבד. אסור לסטות.\n"


def _series_block(index: int, item: GeminiSeriesInput) -> str:
    level = _LEVEL_LABELS[item.level]
    lang = _LANG_CONFIG[item.language]["label"]
    return (
        f"{index}. הנחיות המורה:\n{clean_gemini_user_text(item.instructions)}\n"
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
    title_clean = clean_gemini_user_text(exam_title) if exam_title else ""
    title_line = f"מבחן: {title_clean}\n" if title_clean else ""
    blocks = "\n".join(_series_block(i + 1, s) for i, s in enumerate(series))
    include_tree = series_needs_tree_hint(series)
    languages = sorted({s.language for s in series})
    if len(languages) == 1:
        format_rules = _format_rules(languages[0], include_tree=include_tree)
    else:
        per_lang = "\n\n".join(_format_rules(lang, include_tree=include_tree) for lang in languages)
        format_rules = f"לכל סדרה — השתמש בשפת הסדרה:\n\n{per_lang}"
    sources_part = f"\n{sources_block}\n" if sources_block.strip() else ""
    mandatory = build_mandatory_topic_block(series)
    tree_hint = _AVL_TREE_FORMAT if include_tree else ""
    return f"""צור שאלות מבחן (QCM).
{mandatory}
{title_line}סה״כ {total} שאלות לפי הסדרות:

{blocks}
{sources_part}
{format_rules}
{tree_hint}
התחל מיד עם --- ואז Q1 — ללא הקדמה."""


def build_refine_user_message(message: str, series: list[GeminiSeriesInput]) -> str:
    cleaned = clean_gemini_user_text(message)
    tree_line = ""
    if series_needs_tree_hint(series):
        tree_line = (
            "שרטוט עץ: עטוף ב-``` ; כל ערך מחובר ב-/ או \\ ; שורת /\\ כשיש שני ילדים.\n"
        )
    return f"""בקשת עדכון מהמורה:
{cleaned}

החזר את כל מערך השאלות המלא בפורמט הנדרש (מ-Q1 ברצף), לא רק את השינויים.
חובה: A) B) C) D) בלבד; ב-single בדיוק אפשרות אחת עם * (שורה * בלבד אחרי A) או * בסוף שורת האפשרות הנכונה).
{tree_line}"""
