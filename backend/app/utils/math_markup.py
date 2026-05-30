"""Convertit n^2, x_{i} en HTML <sup>/<sub> pour le PDF."""

from __future__ import annotations

import html
import re


def _read_script(text: str, start: int) -> tuple[str, int] | None:
    if start >= len(text):
        return None
    if text[start] == "{":
        end = text.find("}", start + 1)
        if end == -1:
            return None
        return text[start + 1 : end], end + 1
    match = re.match(r"[0-9]+|[a-zA-Z]", text[start:])
    if not match:
        return None
    value = match.group(0)
    return value, start + len(value)


def contains_math_markup(text: str) -> bool:
    i = 0
    while i < len(text):
        if text[i] == "\\":
            i += 2
            continue
        if text[i] in "^_" and _read_script(text, i + 1):
            return True
        i += 1
    return False


def markup_to_html(text: str) -> str:
    if not text:
        return ""
    parts: list[str] = []
    i = 0
    while i < len(text):
        ch = text[i]
        if ch == "\\" and i + 1 < len(text):
            parts.append(html.escape(text[i + 1]))
            i += 2
            continue
        if ch in "^_":
            parsed = _read_script(text, i + 1)
            if parsed:
                content, nxt = parsed
                tag = "sup" if ch == "^" else "sub"
                valign = "super" if ch == "^" else "sub"
                parts.append(
                    f'<{tag} style="vertical-align:{valign}; font-size:70%">'
                    f"{html.escape(content)}</{tag}>"
                )
                i = nxt
                continue
        if ch == "\n":
            parts.append("<br>")
            i += 1
            continue
        parts.append(html.escape(ch))
        i += 1
    return "".join(parts)
