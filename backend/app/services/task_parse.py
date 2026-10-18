"""Parse la réponse JSON de vérification d'une sous-tâche."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass

from app.services.task_rules import is_known_verdict

_FENCE_RE = re.compile(r"```(?:json)?\s*([\s\S]*?)```", re.IGNORECASE)
_OBJECT_RE = re.compile(r"\{[\s\S]*\}")


@dataclass(frozen=True)
class ParsedTaskVerification:
    verdict: str
    score: float
    appreciation: str


def _json_object(raw: str) -> str:
    fenced = _FENCE_RE.search(raw or "")
    candidate = fenced.group(1) if fenced else (raw or "")
    match = _OBJECT_RE.search(candidate)
    if not match:
        raise ValueError("missing_json")
    return match.group(0)


def parse_task_verification(raw: str) -> ParsedTaskVerification:
    text = (raw or "").strip()
    if not text:
        raise ValueError("empty")
    payload = json.loads(_json_object(text))
    if not isinstance(payload, dict):
        raise ValueError("not_object")
    verdict = str(payload.get("verdict") or "").strip()
    if not is_known_verdict(verdict):
        raise ValueError("bad_verdict")
    appreciation = str(payload.get("appreciation") or "").strip()
    if not appreciation:
        raise ValueError("missing_appreciation")
    try:
        score = float(payload.get("score"))
    except (TypeError, ValueError) as exc:
        raise ValueError("missing_score") from exc
    return ParsedTaskVerification(verdict=verdict, score=score, appreciation=appreciation)
