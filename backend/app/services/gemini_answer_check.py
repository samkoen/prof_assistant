"""Double vérification des réponses générées par l'AI.

1. Le générateur écrit une ligne « Solution: » avant les options (il raisonne avant de marquer).
2. Un second appel résout chaque question sans voir la réponse marquée ; on compare.
3. Les questions de code / calcul sont résolues en exécutant du code (outil Gemini, bac à sable Google).
"""

import asyncio
import logging
import re
from dataclasses import asdict, dataclass

from app.config import settings
from app.services.ai_client import AiError, generate_verification
from app.services.ai_output_language import output_language_name
from app.services.ai_prompt_render import render_prompt
from app.services.ai_prompt_store import get_prompt_body
from app.services.billing.context import unbilled
from app.services.qcm_answer_marks import QcmChoiceBlock, parse_choice_blocks

logger = logging.getLogger(__name__)

STATUS_VERIFIED = "verified"
STATUS_MISMATCH = "mismatch"
STATUS_UNCHECKED = "unchecked"

_SYSTEM = "You verify exam answer keys. Reply with the requested lines only."
_TOOL_RULE_CODE = (
    "Every question here involves code, an algorithm or a calculation. For EACH question, first write and "
    "run Python code that reproduces it literally (run the function, simulate the data-structure operations, "
    "compute the value). Write no answer line before all the code has run: put all the answer lines at the "
    "very end, based on the execution output, not on intuition."
)
_TOOL_RULE_TRACE = (
    "Questions tagged [compute] involve code, an algorithm or a calculation: trace them step by step "
    "(values of variables, tree after each insertion, arithmetic) before answering."
)
_TOOL_RULE_PLAIN = "Think each question through carefully before answering."
_VERDICT_RE = re.compile(
    r"^\s*\**Q(\d+)\**\s*[:\-–]\s*(\?|[A-H](?:\s*,\s*[A-H])*)\s*(?:\|\s*(.*))?$",
    re.IGNORECASE | re.MULTILINE,
)
_CODE_RE = re.compile(
    r"```|\bdef |\breturn\b|\bfor\s*\(|\bwhile\s*\(|\bint\s+\w|printf|System\.out|console\.log|=>|"
    r"\d\s*[-+*/^%]\s*\d|חשב|calculate|compute|calcul",
    re.IGNORECASE,
)
_STRUCTURE_RE = re.compile(r"\bavl\b|\bheap\b|\bhash|\bstack\b|\bqueue\b|מחסנית|ערימה|תור|עץ|tree", re.IGNORECASE)
_NUMBER_RE = re.compile(r"\b\d+\b")


@dataclass(frozen=True)
class AnswerCheck:
    q_num: int
    status: str
    generated: list[str]
    checked: list[str]
    reason: str
    solution: str
    computed: bool


def needs_computation(block: QcmChoiceBlock) -> bool:
    """Questions de code, d'algorithme ou de calcul : à vérifier en exécutant du code."""
    text = "\n".join([block.stem, *(o.text for o in block.options)])
    if _CODE_RE.search(text):
        return True
    return bool(_STRUCTURE_RE.search(text)) and len(_NUMBER_RE.findall(block.stem)) >= 3


def _render_block(block: QcmChoiceBlock) -> str:
    tag = " [compute]" if needs_computation(block) else ""
    options = "\n".join(f"{o.letter}) {o.text}" for o in block.options)
    return f"Q{block.q_num} [{block.question_type}]{tag}\n{block.stem}\n{options}"


def _tool_rule(blocks: list[QcmChoiceBlock], code_tool: bool) -> str:
    if code_tool:
        return _TOOL_RULE_CODE
    return _TOOL_RULE_TRACE if any(needs_computation(b) for b in blocks) else _TOOL_RULE_PLAIN


def build_verify_prompt(blocks: list[QcmChoiceBlock], *, code_tool: bool, language: str = "he") -> str:
    return render_prompt(
        get_prompt_body("generation.verify"),
        {
            "questions": "\n\n".join(_render_block(b) for b in blocks),
            "tool_rule": _tool_rule(blocks, code_tool),
            "language": output_language_name(language),
        },
    )


def parse_verdicts(text: str) -> dict[int, tuple[list[str], str]]:
    """{numéro Q: (lettres, raison)} ; « ? » donne une liste vide. La dernière ligne d'une question l'emporte
    (le modèle peut écrire une première réponse puis la corriger après avoir exécuté du code)."""
    out: dict[int, tuple[list[str], str]] = {}
    for match in _VERDICT_RE.finditer(text or ""):
        letters_raw = match.group(2).upper()
        letters = [] if letters_raw == "?" else sorted({x.strip() for x in letters_raw.split(",")})
        out[int(match.group(1))] = (letters, (match.group(3) or "").strip())
    return out


def _status(generated: list[str], verdict: tuple[list[str], str] | None) -> str:
    if verdict is None:
        return STATUS_UNCHECKED
    return STATUS_VERIFIED if verdict[0] == generated else STATUS_MISMATCH


def compare_answers(
    blocks: list[QcmChoiceBlock],
    verdicts: dict[int, tuple[list[str], str]],
    solutions: dict[int, str],
    *,
    computed: set[int] | frozenset[int] = frozenset(),
) -> list[AnswerCheck]:
    checks: list[AnswerCheck] = []
    for block in blocks:
        generated = sorted(block.correct_letters)
        verdict = verdicts.get(block.q_num)
        checks.append(
            AnswerCheck(
                q_num=block.q_num,
                status=_status(generated, verdict),
                generated=generated,
                checked=verdict[0] if verdict else [],
                reason=verdict[1] if verdict else "",
                solution=solutions.get(block.q_num, ""),
                computed=verdict is not None and block.q_num in computed,
            )
        )
    return checks


async def _verify_group(blocks: list[QcmChoiceBlock], *, code_tool: bool, language: str) -> tuple[dict, set[int]]:
    """Un appel pour un groupe ; renvoie (verdicts, questions réellement vérifiées par du code)."""
    if not blocks:
        return {}, set()
    prompt = build_verify_prompt(blocks, code_tool=code_tool, language=language)
    try:
        text, ran = await generate_verification(prompt, system=_SYSTEM, code_execution=code_tool)
    except AiError as exc:
        logger.warning("Answer check failed (code_tool=%s): %s", code_tool, exc)
        return {}, set()
    return parse_verdicts(text), ({b.q_num for b in blocks} if ran else set())


def _split_groups(blocks: list[QcmChoiceBlock]) -> tuple[list[QcmChoiceBlock], list[QcmChoiceBlock]]:
    """(questions à exécuter, autres) — l'exécution de code se fait dans un appel séparé et ciblé."""
    if not settings.answer_check_code_execution:
        return [], blocks
    compute = [b for b in blocks if needs_computation(b)]
    return compute, [b for b in blocks if not needs_computation(b)]


async def check_answers(raw: str, solutions: dict[int, str], language: str = "he") -> list[AnswerCheck]:
    """Vérifie les questions à choix du brut QCM. Ne lève jamais : en cas d'échec, « non vérifié »."""
    blocks = parse_choice_blocks(raw)
    if not blocks or not settings.answer_check_enabled:
        return compare_answers(blocks, {}, solutions)
    compute, plain = _split_groups(blocks)
    async with unbilled():  # contrôle qualité de la plateforme : pas de crédit débité
        (code_verdicts, ran), (plain_verdicts, _) = await asyncio.gather(
            _verify_group(compute, code_tool=True, language=language),
            _verify_group(plain, code_tool=False, language=language),
        )
    return compare_answers(blocks, {**plain_verdicts, **code_verdicts}, solutions, computed=ran)


def checks_to_params(checks: list[AnswerCheck]) -> dict[str, dict]:
    return {str(c.q_num): asdict(c) for c in checks}
