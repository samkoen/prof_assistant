"""Notes IA par question (solution du générateur + double vérification), recopiées à l'acceptation.

Pendant la génération, elles vivent dans `params` de la série, indexées par numéro Q.
Le prof peut retirer ou réordonner des questions avant d'accepter : on rapproche donc
par l'énoncé, pas par la position. Les lettres des notes se réfèrent à l'ordre d'origine
des options (avant mélange) : on recopie cet ordre dans la note pour que le tuteur s'y retrouve.
"""

import re

from app.services.qcm_answer_marks import QcmChoiceBlock, parse_choice_blocks

_NON_WORD_RE = re.compile(r"[\W_]+", re.UNICODE)
MAX_NOTES_CHARS = 4000


def normalize_stem(text: str) -> str:
    return _NON_WORD_RE.sub("", text or "").lower()


def _status_line(check: dict) -> str:
    status = str(check.get("status") or "")
    reason = str(check.get("reason") or "").strip()
    if status == "verified":
        return f"Independent re-solve: agrees with the key. {reason}".strip()
    if status == "mismatch":
        checked = ", ".join(check.get("checked") or []) or "?"
        return f"Independent re-solve found {checked} (the teacher reviewed this). {reason}".strip()
    return ""


def block_notes(block: QcmChoiceBlock, check: dict) -> str:
    """Texte des notes d'une question ; vide s'il n'y a rien d'utile à transmettre."""
    solution = str(check.get("solution") or "").strip()
    status = _status_line(check)
    if not solution and not status:
        return ""
    options = "\n".join(f"{o.letter}) {o.text}" for o in block.options)
    parts = [f"Original option order used in these notes:\n{options}"]
    if solution:
        parts.append(f"Generator's worked solution: {solution}")
    if status:
        parts.append(status)
    return "\n".join(parts)[:MAX_NOTES_CHARS]


def notes_by_stem(params: dict) -> dict[str, str]:
    """{énoncé normalisé: notes} à partir des paramètres d'une série de génération."""
    checks = params.get("answer_checks") or {}
    out: dict[str, str] = {}
    for block in parse_choice_blocks(str(params.get("accumulated_raw") or "")):
        notes = block_notes(block, checks.get(str(block.q_num)) or {})
        key = normalize_stem(block.stem)
        if notes and key:
            out[key] = notes
    return out


def match_notes(question_text: str, notes: dict[str, str]) -> str | None:
    key = normalize_stem(question_text)
    if not key:
        return None
    if key in notes:
        return notes[key]
    # Le texte enregistré peut avoir perdu un préfixe ou une mise en forme : inclusion stricte.
    candidates = [v for k, v in notes.items() if len(k) >= 20 and (k in key or key in k)]
    return candidates[0] if len(candidates) == 1 else None
