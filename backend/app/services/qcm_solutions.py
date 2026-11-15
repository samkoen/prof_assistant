"""Ligne « Solution: » écrite par le modèle avant les options (raisonner avant de marquer la réponse).

Elle sert à la vérification et à l'affichage pour le prof, mais ne doit jamais
arriver dans le texte de la question : on la retire du brut avant validation.
"""

import re

from app.services.gemini_qcm_batch import split_qcm_blocks

_SOLUTION_RE = re.compile(r"^\s*\**(?:solution|פתרון|résolution|решение)\**\s*:\s*(.*)$", re.IGNORECASE)
_OPTION_RE = re.compile(r"^\s*\**[A-H]\)", re.IGNORECASE)
_HEADER_NUM_RE = re.compile(r"^\s*Q(\d+)\b", re.IGNORECASE)


def _block_q_num(lines: list[str]) -> int | None:
    header = next((line for line in lines if line.strip()), "")
    match = _HEADER_NUM_RE.match(header)
    return int(match.group(1)) if match else None


def _solution_span(lines: list[str]) -> tuple[int, int] | None:
    """(début, fin exclue) de la solution : jusqu'à la première option, sinon la seule ligne."""
    start = next((i for i, line in enumerate(lines) if _SOLUTION_RE.match(line)), None)
    if start is None:
        return None
    end = next((i for i in range(start + 1, len(lines)) if _OPTION_RE.match(lines[i])), None)
    return (start, end if end is not None else start + 1)


def _strip_block(block: str) -> tuple[str, int | None, str]:
    lines = block.splitlines()
    span = _solution_span(lines)
    if span is None:
        return block, None, ""
    start, end = span
    first = _SOLUTION_RE.match(lines[start]).group(1)
    solution = "\n".join([first, *lines[start + 1 : end]]).strip()
    kept = lines[:start] + lines[end:]
    return "\n".join(kept).strip(), _block_q_num(lines), solution


def strip_solutions(raw: str) -> tuple[str, dict[int, str]]:
    """Retire les lignes Solution du brut QCM ; renvoie (brut nettoyé, {numéro Q: solution})."""
    blocks = split_qcm_blocks(raw)
    if not blocks:
        return raw, {}
    cleaned: list[str] = []
    solutions: dict[int, str] = {}
    for block in blocks:
        text, q_num, solution = _strip_block(block)
        cleaned.append(text)
        if q_num is not None and solution:
            solutions[q_num] = solution
    if not solutions and all(c == b for c, b in zip(cleaned, blocks)):
        return raw, {}
    prefix = "---\n" if raw.lstrip().startswith("---") else ""
    return prefix + "\n---\n".join(cleaned), solutions
