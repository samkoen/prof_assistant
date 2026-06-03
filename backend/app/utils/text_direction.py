"""Détection RTL/LTR à partir du contenu des questions."""

from __future__ import annotations

import re

from app.models.exam import Question

_HEBREW_RE = re.compile(r"[\u0590-\u05FF]")
_LATIN_RE = re.compile(r"[A-Za-zÀ-ÿĀ-žА-я]")


def text_looks_hebrew(text: str) -> bool:
    hebrew = len(_HEBREW_RE.findall(text or ""))
    latin = len(_LATIN_RE.findall(text or ""))
    if hebrew == 0:
        return False
    if latin == 0:
        return True
    return hebrew >= latin


def _sample_from_question(question: Question) -> str:
    opts = sorted(question.options, key=lambda o: o.order_index)
    parts = [question.text or "", *[o.text or "" for o in opts]]
    return "\n".join(p for p in parts if p.strip())


def exam_content_is_rtl(questions: list[Question]) -> bool:
    if not questions:
        return True
    ordered = sorted(questions, key=lambda q: (q.order_index, q.id))
    return text_looks_hebrew(_sample_from_question(ordered[0]))
