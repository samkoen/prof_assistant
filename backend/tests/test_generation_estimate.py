"""Estimation du coût d'une génération (affichée avant confirmation)."""

from app.schemas.gemini_questions import GeminiSeriesInput
from app.services.billing.estimate import credits_for_calls, estimate_generation


def _series(count: int, instructions: str = "בסיסי נתונים") -> list[GeminiSeriesInput]:
    return [GeminiSeriesInput(instructions=instructions, question_count=count, level="easy", question_types=["single"])]


def test_credits_for_calls_rounds_up_per_block():
    assert credits_for_calls(0, 5) == 0
    assert credits_for_calls(1, 5) == 1
    assert credits_for_calls(5, 5) == 1
    assert credits_for_calls(6, 5) == 2


def test_normal_generation_costs_one_credit_whatever_the_size():
    estimate = estimate_generation(_series(30), 5)
    assert estimate.credits == 1
    assert estimate.calls_per_credit == 5


def test_worst_case_counts_chunked_batches_after_timeout():
    estimate = estimate_generation(_series(30), 5)
    assert estimate.max_credits > estimate.credits  # 15 lots de 2 → 3 crédits


def test_small_request_has_no_extra_worst_case():
    estimate = estimate_generation(_series(3), 5)
    assert estimate.credits == estimate.max_credits == 1


def test_admin_generation_is_free():
    estimate = estimate_generation(_series(20), 5, free=True)
    assert (estimate.credits, estimate.max_credits) == (0, 0)
