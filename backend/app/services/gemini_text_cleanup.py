"""Réduction des tokens Gemini — nettoyage texte avant envoi à l'API."""

import re
from html import unescape

_NULL = "\x00"
_HTML_TAGS = re.compile(r"<[^>]+>", re.DOTALL)
_SCRIPT_STYLE = re.compile(r"<(script|style)[^>]*>.*?</\1>", re.DOTALL | re.IGNORECASE)
_EXCESS_NEWLINES = re.compile(r"\n{3,}")
_TRAILING_WS = re.compile(r"[ \t]+$", re.MULTILINE)
_LOG_LINE = re.compile(
    r"^[\t ]*(?:"
    r"\d{4}-\d{2}-\d{2}[T\s]\d"
    r"|\[(?:INFO|DEBUG|WARN|ERROR|TRACE)\]"
    r"|(?:INFO|DEBUG|WARN|ERROR|TRACE)\s*[:\|]"
    r").*$",
    re.MULTILINE | re.IGNORECASE,
)


def _normalize_newlines(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def _strip_html(text: str) -> str:
    text = _SCRIPT_STYLE.sub(" ", text)
    text = unescape(text)
    return _HTML_TAGS.sub(" ", text)


def _strip_html_if_present(text: str) -> str:
    if "<" not in text or ">" not in text:
        return text
    return _strip_html(text)


def _finalize(text: str) -> str:
    text = _TRAILING_WS.sub("", text)
    text = _EXCESS_NEWLINES.sub("\n\n", text)
    return text.strip()


def clean_gemini_source_text(text: str) -> str:
    """Fichiers PDF/TXT/MD — HTML, logs, lignes vides excessives (sans fusionner les espaces internes)."""
    if not text:
        return ""
    out = _normalize_newlines(text).replace(_NULL, "")
    out = _strip_html_if_present(out)
    out = _LOG_LINE.sub("", out)
    return _finalize(out)


def clean_gemini_user_text(text: str) -> str:
    """הנחיות מורה, כותרת מבחן, בקשות עדכון."""
    if not text:
        return ""
    out = _normalize_newlines(text.strip()).replace(_NULL, "")
    out = _strip_html_if_present(out)
    return _finalize(out)
