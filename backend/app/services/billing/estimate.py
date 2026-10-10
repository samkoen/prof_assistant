"""Estimation du coût en crédits d'une génération d'examen (affichée avant confirmation)."""

from dataclasses import dataclass
from math import ceil

from app.schemas.gemini_questions import GeminiSeriesInput
from app.services.gemini_batch_plan import build_batch_plan, build_chunked_batch_plan


@dataclass(frozen=True)
class GenerationEstimate:
    credits: int
    max_credits: int
    calls_per_credit: int


def credits_for_calls(calls: int, calls_per_credit: int) -> int:
    """Un crédit couvre `calls_per_credit` appels IA d'une même session."""
    if calls <= 0:
        return 0
    return ceil(calls / max(1, calls_per_credit))


def estimate_generation(
    series: list[GeminiSeriesInput], calls_per_credit: int, *, free: bool = False
) -> GenerationEstimate:
    """Cas normal : une requête pour tout l'examen ; pire cas : découpage en lots après un timeout."""
    if free:
        return GenerationEstimate(0, 0, calls_per_credit)
    typical = credits_for_calls(len(build_batch_plan(series)), calls_per_credit)
    worst = credits_for_calls(len(build_chunked_batch_plan(series)), calls_per_credit)
    return GenerationEstimate(typical, max(typical, worst), calls_per_credit)
