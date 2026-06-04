"""Segments LTR (math, code) isolés dans un paragraphe RTL pour le PDF."""

from __future__ import annotations

import html
import re

from app.utils.math_markup import markup_to_html

_HEBREW = re.compile(r"[\u0590-\u05FF\uFB1D-\uFB4F]")
_LTR_STRONG = re.compile(r"[A-Za-z0-9]")
_MATH_NEUTRAL = set("+-*/=^_{}().,[]\\|<>≤≥≠")


def _char_kind(ch: str) -> str:
    if ch == "\n":
        return "nl"
    if _HEBREW.match(ch):
        return "rtl"
    if _LTR_STRONG.match(ch) or ch in _MATH_NEUTRAL:
        return "ltr"
    return "neutral"


def split_mixed_runs(text: str) -> list[tuple[str, str]]:
    """Découpe en segments rtl / ltr (neutral rattaché au segment courant ou suivant)."""
    if not text:
        return []
    runs: list[tuple[str, str]] = []
    buf: list[str] = []
    cur: str | None = None

    def flush() -> None:
        nonlocal buf, cur
        if buf and cur:
            runs.append((cur, "".join(buf)))
        buf = []

    for ch in text:
        kind = _char_kind(ch)
        if kind == "nl":
            flush()
            runs.append(("nl", "\n"))
            cur = None
            continue
        if kind == "neutral":
            buf.append(ch)
            continue
        if cur is None:
            cur = kind
            buf.append(ch)
            continue
        if kind == cur:
            buf.append(ch)
            continue
        flush()
        cur = kind
        buf.append(ch)
    flush()
    return runs


def _rtl_chunk_to_html(chunk: str) -> str:
    return html.escape(chunk).replace("\n", "<br>")


def mixed_text_to_html(text: str, *, wrap_ltr: bool = True) -> str:
    """HTML corps de paragraphe : hébreu RTL + îlots LTR isolés (formules, code)."""
    if not text:
        return ""
    if not wrap_ltr:
        return markup_to_html(text)

    parts: list[str] = []
    for kind, chunk in split_mixed_runs(text):
        if kind == "nl":
            parts.append("<br>")
            continue
        if kind == "ltr":
            inner = markup_to_html(chunk)
            parts.append(
                f'<span dir="ltr" style="unicode-bidi:isolate; direction:ltr;">{inner}</span>'
            )
        else:
            parts.append(_rtl_chunk_to_html(chunk))
    return "".join(parts)


def needs_mixed_html(text: str, *, rtl: bool) -> bool:
    if not text or not rtl:
        return False
    if _LTR_STRONG.search(text):
        return True
    return any(_LTR_STRONG.match(c) for c in text)
