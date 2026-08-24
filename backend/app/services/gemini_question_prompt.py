import re

from app.models.enums import QuestionType
from app.schemas.gemini_questions import GeminiSeriesInput, GeminiSeriesLanguage
from app.services.ai_output_language import output_language_name, output_language_rule
from app.services.ai_prompt_render import render_prompt
from app.services.ai_prompt_store import get_prompt_body
from app.services.gemini_text_cleanup import clean_gemini_user_text

REFINE_USER_MARKER = "Teacher update request:"
GENERATION_PROMPT_MARKER = "Generate exam questions."
BATCH_PROMPT_MARKER = "Now generate exactly"
_LEGACY_REFINE = "בקשת עדכון מהמורה"
_LEGACY_GENERATION = "צור שאלות מבחן"
_LEGACY_BATCH = "עכשיו צור בדיוק"

_LEVEL_LABELS = {"easy": "easy", "medium": "medium", "hard": "hard"}
_TYPE_LABELS = {
    QuestionType.SINGLE: "single choice (single)",
    QuestionType.MULTIPLE: "multiple choice (multiple)",
    QuestionType.TRUE_FALSE: "true/false (true_false)",
    QuestionType.OPEN: "open question (open)",
}

_LANG_CONFIG: dict[GeminiSeriesLanguage, dict[str, str]] = {
    "he": {
        "tf": 'For true_false: lines "נכון" / "לא נכון" with * on the correct one',
    },
    "fr": {
        "tf": 'For true_false: lines "Vrai" / "Faux" with * on the correct one',
    },
    "en": {
        "tf": 'For true_false: lines "True" / "False" with * on the correct one',
    },
    "ru": {
        "tf": 'For true_false: lines "Верно" / "Неверно" with * on the correct one',
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
AVL tree drawing — mandatory rules (every option that contains a tree):
1) Wrap the whole drawing in ``` (a ``` line before and after) — required.
2) / = left-child edge only; \\ = right-child edge only. Never draw only / when a right child exists.
3) For every node with two children: the edge line must contain both / and \\ (e.g. "     /  \\" under the root).
4) Every value must be connected: each child needs a / or \\ from its parent. No dangling value (e.g. 35 without \\ under 40).
5) Root number centered above the /\\ node; each child value sits directly under its edge.
6) Small tree (up to 4 levels), spaces for alignment — no tabs.

Correct example (copy this structure):
B)
*
```
      30
     /  \\
   20    40
  /       \\
10        35
```

Forbidden example (do not produce):
  30
  /
 20  40
(missing ``` and missing \\ to 35)

In QCM format: A) or B) then a * line then ``` tree ``` ; for single, exactly one option with *.
"""

_TREE_OPTION_RULES = """
- After A) extra lines are allowed (ASCII tree, table, etc.)
- ASCII drawing (AVL tree, data structure): wrap in ``` before and after the drawing (separate lines), inside the option — not outside A) B)
- Single-choice example with a tree:
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


def is_refine_prompt(content: str) -> bool:
    return REFINE_USER_MARKER in content or _LEGACY_REFINE in content


def is_generation_prompt(content: str) -> bool:
    return (
        GENERATION_PROMPT_MARKER in content
        or BATCH_PROMPT_MARKER in content
        or _LEGACY_GENERATION in content
        or _LEGACY_BATCH in content
    )


def series_needs_tree_hint(series: list[GeminiSeriesInput]) -> bool:
    return any(_TREE_TOPIC_RE.search(s.instructions) for s in series)


def _write_rule(lang: GeminiSeriesLanguage) -> str:
    return (
        f"Write all questions, options, and true/false lines in {output_language_rule(lang)}."
    )


def _format_rules(lang: GeminiSeriesLanguage, *, include_tree: bool) -> str:
    cfg = _LANG_CONFIG[lang]
    tree_rules = _TREE_OPTION_RULES if include_tree else ""
    markdown_rule = (
        "- markdown: ``` around ASCII drawings is allowed; also **bold**, *italic*, `code`, lists with -"
        if include_tree
        else "- markdown: ``` for code is allowed; also **bold**, *italic*, `code`, lists with -"
    )
    return f"""Required format:
- Separate questions with a --- line only
- Header: Q<num> [single|multiple|true_false|open] (1 pt) — global running number
- {_write_rule(lang)}
- Options: A) B) C) D) — only for single/multiple/true_false
- For open questions: question text only, no A) B) and no correct-answer mark
{tree_rules}- Correct mark (required): a * line right after A), or A) * then text, or * at the end of the answer line — do not write «wrong» as a mark (only * or ✓)
- Single-choice example (plain text):
  A)
  *
  Correct option text
  C) Wrong option
- {cfg["tf"]}
- Single choice: exactly one option with * (required — without * the system rejects it)
- Multiple choice: at least two options, at least one with *
- {markdown_rule}
- Forbidden: א) ב) ג) — only A) B) C) D); no * inside option text (only as the correct mark)"""


def _types_line(types: list[QuestionType]) -> str:
    return ", ".join(_TYPE_LABELS[t] for t in types)


def build_mandatory_topic_block(series: list[GeminiSeriesInput]) -> str:
    parts = [clean_gemini_user_text(s.instructions) for s in series if s.instructions.strip()]
    combined = " | ".join(parts)
    return render_prompt(get_prompt_body("generation.mandatory"), {"combined": combined})


def _series_block(index: int, item: GeminiSeriesInput) -> str:
    level = _LEVEL_LABELS[item.level]
    lang = output_language_name(item.language)
    return (
        f"{index}. Teacher instructions:\n{clean_gemini_user_text(item.instructions)}\n"
        f"   Number of questions: {item.question_count}\n"
        f"   Level: {level}\n"
        f"   Language: {lang}\n"
        f"   Allowed question types: {_types_line(item.question_types)}\n"
        f"   Split the questions roughly evenly across the allowed types."
    )


def _generation_format_rules(series: list[GeminiSeriesInput], *, include_tree: bool) -> str:
    languages = sorted({s.language for s in series})
    if len(languages) == 1:
        return _format_rules(languages[0], include_tree=include_tree)
    per_lang = "\n\n".join(_format_rules(lang, include_tree=include_tree) for lang in languages)
    return f"For each series, use that series language:\n\n{per_lang}"


def build_questions_generation_prompt(
    series: list[GeminiSeriesInput],
    exam_title: str | None = None,
    sources_block: str = "",
) -> str:
    total = sum(s.question_count for s in series)
    title_clean = clean_gemini_user_text(exam_title) if exam_title else ""
    title_line = f"Exam: {title_clean}\n" if title_clean else ""
    blocks = "\n".join(_series_block(i + 1, s) for i, s in enumerate(series))
    include_tree = series_needs_tree_hint(series)
    sources_part = f"\n{sources_block}\n" if sources_block.strip() else ""
    return render_prompt(
        get_prompt_body("generation.user"),
        {
            "mandatory": build_mandatory_topic_block(series),
            "title_line": title_line,
            "total": total,
            "series_blocks": blocks,
            "sources_part": sources_part,
            "format_rules": _generation_format_rules(series, include_tree=include_tree),
            "tree_hint": _AVL_TREE_FORMAT if include_tree else "",
        },
    )


def build_refine_user_message(message: str, series: list[GeminiSeriesInput]) -> str:
    cleaned = clean_gemini_user_text(message)
    tree_line = ""
    if series_needs_tree_hint(series):
        tree_line = (
            "Tree drawing: wrap in ``` ; every value connected with / or \\ ; /\\ line when two children.\n"
        )
    return render_prompt(
        get_prompt_body("generation.refine"),
        {"teacher_message": cleaned, "tree_line": tree_line},
    )
