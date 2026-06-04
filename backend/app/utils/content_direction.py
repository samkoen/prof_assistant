"""Direction RTL/LTR par ligne — aligné sur le frontend (examQuestionsLanguage)."""

from __future__ import annotations

import re

_BIDI_MARKS = re.compile(r"[\u200E\u200F]")
_HEBREW_RE = re.compile(r"[\u0590-\u05FF]")
_LATIN_RE = re.compile(r"[A-Za-zÀ-ÿĀ-žА-я]")
_MATH_NEUTRAL = "+-*/=^_{}().,[]"
_DIGITS_ONLY = re.compile(r"^[\d\u0660-\u0669\s]+$")


def strip_editor_bidi_marks(text: str) -> str:
    return _BIDI_MARKS.sub("", text or "")


def first_non_empty_line(lines: list[str]) -> str:
    for line in lines:
        if line.strip():
            return line
    return lines[0] if lines else ""


def text_is_digits_only(text: str) -> bool:
    body = strip_editor_bidi_marks(text).strip()
    if not body:
        return False
    return bool(_DIGITS_ONLY.match(body))


def _text_looks_hebrew(text: str) -> bool:
    hebrew = len(_HEBREW_RE.findall(text or ""))
    latin = len(_LATIN_RE.findall(text or ""))
    if hebrew == 0:
        return False
    if latin == 0:
        return True
    return hebrew >= latin


def content_dir_for_question_text(text: str) -> str:
    return "rtl" if _text_looks_hebrew(strip_editor_bidi_marks(text)) else "ltr"


def content_dir_for_option_text(option_text: str, question_text: str) -> str:
    q = strip_editor_bidi_marks(question_text)
    o = strip_editor_bidi_marks(option_text)
    if _text_looks_hebrew(q) and text_is_digits_only(o):
        return "rtl"
    return content_dir_for_question_text(o)


def content_dir_for_line(line: str, question_text: str | None = None) -> str:
    body = strip_editor_bidi_marks(line)
    if question_text and _text_looks_hebrew(question_text) and text_is_digits_only(body):
        return "rtl"
    for ch in body:
        if _HEBREW_RE.match(ch):
            return "rtl"
        if _LATIN_RE.match(ch) or ch.isdigit() or ch in _MATH_NEUTRAL:
            return "ltr"
    return "rtl"


def line_html_align_dir(
    line: str, *, default_rtl: bool, question_text: str | None = None
) -> tuple[str, str]:
    if not strip_editor_bidi_marks(line).strip():
        if default_rtl:
            return "right", "rtl"
        return "left", "ltr"
    if content_dir_for_line(line, question_text) == "rtl":
        return "right", "rtl"
    return "left", "ltr"


def prefix_html_align_dir(anchor_line: str, *, question_rtl: bool) -> tuple[str, str]:
    if question_rtl:
        return "right", "rtl"
    return line_html_align_dir(anchor_line, default_rtl=False)
