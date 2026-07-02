from app.schemas.gemini_questions import GeminiSeriesInput
from app.services.gemini_batch_plan import GeminiBatchSlice
from app.services.gemini_question_prompt import (
    build_questions_generation_prompt,
    series_needs_tree_hint,
)


def _q_range_label(batch: GeminiBatchSlice) -> str:
    if batch.count == 1:
        return f"Q{batch.from_q}"
    last = batch.from_q + batch.count - 1
    return f"Q{batch.from_q}–Q{last}"


def _prior_block(accumulated_raw: str) -> str:
    text = accumulated_raw.strip()
    if not text:
        return ""
    return f"""
שאלות שכבר נוצרו — אסור לחזור על הנושאים, הניסוחים או הדוגמאות:
{text}
"""


def _batch_instructions(batch: GeminiBatchSlice, *, retry_hint: str | None) -> str:
    last = batch.from_q + batch.count - 1
    nums = ", ".join(f"Q{n}" for n in range(batch.from_q, last + 1))
    retry = f"\n{retry_hint.strip()}\n" if retry_hint else ""
    return f"""
עכשיו צור בדיוק {batch.count} שאלות נוספות: {nums}.
- המשך את המספור הגלובלי (התחל מ-Q{batch.from_q}, לא Q1 מחדש).
- נושאים וזוויות שונים מהשאלות שכבר נוצרו.
- החזר רק את {nums} — אל תחזיר שאלות קודמות.
- התחל מיד עם --- ואז Q{batch.from_q} — ללא הקדמה.{retry}
"""


def build_batch_generation_prompt(
    series: list[GeminiSeriesInput],
    batch: GeminiBatchSlice,
    *,
    exam_title: str | None = None,
    sources_block: str = "",
    accumulated_raw: str = "",
    retry_hint: str | None = None,
) -> str:
    base = build_questions_generation_prompt(series, exam_title, sources_block)
    prior = _prior_block(accumulated_raw)
    batch_line = _batch_instructions(batch, retry_hint=retry_hint)
    if batch.from_q == 1 and not accumulated_raw.strip():
        return f"""{base}

{batch_line}"""
    tree_note = ""
    if series_needs_tree_hint(series):
        tree_note = "השתמש בדוגמאות מספריות שונות משאלות קודמות.\n"
    return f"""{base}
{prior}
{tree_note}{batch_line}"""
