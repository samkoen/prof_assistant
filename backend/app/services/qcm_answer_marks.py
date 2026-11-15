"""Lecture des réponses marquées (*, ✓) dans un bloc QCM généré — mêmes règles que le parseur du front."""

import re
from dataclasses import dataclass

from app.services.gemini_qcm_batch import extract_block_stem, split_qcm_blocks

_HEADER_RE = re.compile(r"^\s*Q(\d+)\b[^\[\n]*(?:\[(\w+)\])?", re.IGNORECASE)
_OPTION_RE = re.compile(r"^\s*\**([A-H])\)\**\s*(.*)$", re.IGNORECASE)
_MARK_CHARS = "*✓✔★"
_MARKER_ONLY_RE = re.compile(rf"^[{_MARK_CHARS}]\s*$")
_TRAILING_MARK_RE = re.compile(rf"\s*[{_MARK_CHARS}]\s*$")
_LEADING_MARK_RE = re.compile(rf"^[{_MARK_CHARS}]+\s*")
_TF_LINE_RE = re.compile(
    r"^(?:vrai|faux|true|false|נכון|לא נכון|верно|неверно)\s*[*✓✔★]?\s*$",
    re.IGNORECASE,
)

LETTERS = "ABCDEFGH"


@dataclass(frozen=True)
class QcmOption:
    letter: str
    text: str
    correct: bool


@dataclass(frozen=True)
class QcmChoiceBlock:
    q_num: int
    question_type: str
    stem: str
    options: tuple[QcmOption, ...]

    @property
    def correct_letters(self) -> tuple[str, ...]:
        return tuple(o.letter for o in self.options if o.correct)


def _clean_line(line: str) -> tuple[str, bool]:
    """Retire la marque d'une ligne d'option ; renvoie (texte, marquée)."""
    stripped = line.strip()
    if _MARKER_ONLY_RE.match(stripped):
        return "", True
    if stripped.startswith("```"):
        return line.rstrip(), False
    marked = False
    if _LEADING_MARK_RE.match(stripped) and not stripped.startswith("**"):
        stripped = _LEADING_MARK_RE.sub("", stripped)
        marked = True
    if _TRAILING_MARK_RE.search(stripped) and not stripped.endswith("**"):
        stripped = _TRAILING_MARK_RE.sub("", stripped)
        marked = True
    return stripped, marked


def _option_from_lines(letter: str, lines: list[str]) -> QcmOption:
    texts: list[str] = []
    correct = False
    for line in lines:
        text, marked = _clean_line(line)
        correct = correct or marked
        if text:
            texts.append(text)
    return QcmOption(letter=letter, text="\n".join(texts).strip(), correct=correct)


def _lettered_options(lines: list[str]) -> list[QcmOption]:
    groups: list[tuple[str, list[str]]] = []
    for line in lines:
        match = _OPTION_RE.match(line)
        if match:
            groups.append((match.group(1).upper(), [match.group(2)]))
        elif groups:
            groups[-1][1].append(line)
    return [_option_from_lines(letter, body) for letter, body in groups]


def _true_false_options(lines: list[str]) -> list[QcmOption]:
    tf_lines = [line for line in lines if _TF_LINE_RE.match(line.strip())]
    return [_option_from_lines(LETTERS[i], [line]) for i, line in enumerate(tf_lines[:2])]


def parse_choice_block(block: str) -> QcmChoiceBlock | None:
    """Bloc à choix (single / multiple / true_false) ; None pour une question ouverte ou illisible."""
    lines = block.splitlines()
    header = next((line for line in lines if line.strip()), "")
    match = _HEADER_RE.match(header)
    if not match:
        return None
    qtype = (match.group(2) or "single").lower()
    if qtype == "open":
        return None
    body = lines[lines.index(header) + 1 :]
    options = _lettered_options(body) or _true_false_options(body)
    if len(options) < 2:
        return None
    return QcmChoiceBlock(int(match.group(1)), qtype, extract_block_stem(block), tuple(options))


def parse_choice_blocks(raw: str) -> list[QcmChoiceBlock]:
    blocks = (parse_choice_block(b) for b in split_qcm_blocks(raw))
    return [b for b in blocks if b is not None]
