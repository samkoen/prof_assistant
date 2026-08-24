"""Nettoyage des textes d'évaluation ouverte (scripts parasites, transcripción)."""

from __future__ import annotations

import re

_HEBREW_RE = re.compile(r"[\u0590-\u05FF]")
_LATIN_RE = re.compile(r"[A-Za-z]")
_CJK_CYRILLIC_RE = re.compile(
    r"[\u0400-\u04FF\u3000-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\uFF00-\uFFEF\uFFFD]+"
)
_CJK_ONLY_RE = re.compile(r"[\u3000-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\uFF00-\uFFEF\uFFFD]+")
_MULTI_SPACE_RE = re.compile(r"[^\S\n]{2,}")
_ROMANIZED_HE = re.compile(
    r"\b(zlila|bshvil|hakavod|shehigata|hamivne|kol hakavod|stam chasar)\b",
    re.IGNORECASE,
)


def _script_counts(text: str) -> tuple[int, int]:
    return len(_HEBREW_RE.findall(text or "")), len(_LATIN_RE.findall(text or ""))


def _latin_heavy_tail(text: str) -> bool:
    tail = text[-200:] if len(text) > 200 else text
    hebrew, latin = _script_counts(tail)
    return latin >= 50 and hebrew < 10


def looks_latin_transliteration(text: str) -> bool:
    """True si hébreu phonétique latin (« zlila bshvil ») ou fin de texte en latin."""
    if not text:
        return False
    if _ROMANIZED_HE.search(text):
        return True
    if _latin_heavy_tail(text):
        return True
    hebrew, latin = _script_counts(text)
    if hebrew >= 20:
        return False
    return latin >= 40 and hebrew < latin * 0.25


def strip_foreign_scripts(text: str, language: str) -> str:
    if not text:
        return ""
    pattern = _CJK_ONLY_RE if language == "ru" else _CJK_CYRILLIC_RE
    cleaned = pattern.sub("", text)
    cleaned = _MULTI_SPACE_RE.sub(" ", cleaned)
    return cleaned.strip()


def sanitize_eval_text(text: str | None, language: str) -> str | None:
    if text is None:
        return None
    cleaned = strip_foreign_scripts(text, language)
    return cleaned or None
