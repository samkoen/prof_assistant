"""Parse la réponse JSON d'évaluation d'une question ouverte."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass


@dataclass(frozen=True)
class ParsedOpenEvaluation:
    appreciation: str
    score: float
    model_answer: str | None


_FENCE_RE = re.compile(r"```(?:json)?\s*([\s\S]*?)```", re.IGNORECASE)
_OBJECT_RE = re.compile(r"\{[\s\S]*\}")


def _extract_json_object(raw: str) -> str:
    fenced = _FENCE_RE.search(raw)
    candidate = fenced.group(1) if fenced else raw
    match = _OBJECT_RE.search(candidate)
    if not match:
        raise ValueError("missing_json")
    return match.group(0)


def parse_open_evaluation_json(raw: str) -> ParsedOpenEvaluation:
    text = (raw or "").strip()
    if not text:
        raise ValueError("empty")
    payload = json.loads(_extract_json_object(text))
    if not isinstance(payload, dict):
        raise ValueError("not_object")
    appreciation = str(payload.get("appreciation") or "").strip()
    if not appreciation:
        raise ValueError("missing_appreciation")
    try:
        score = float(payload.get("score"))
    except (TypeError, ValueError) as exc:
        raise ValueError("missing_score") from exc
    model_raw = payload.get("model_answer")
    model_answer = str(model_raw).strip() if model_raw else None
    return ParsedOpenEvaluation(
        appreciation=appreciation,
        score=score,
        model_answer=model_answer or None,
    )
