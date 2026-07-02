from dataclasses import dataclass

from app.schemas.gemini_questions import GeminiSeriesInput
from app.services.gemini_question_prompt import series_needs_tree_hint

FALLBACK_BATCH_SIZE = 3
HEAVY_TOPIC_BATCH_SIZE = 2


@dataclass(frozen=True)
class GeminiBatchSlice:
    from_q: int
    count: int


def total_questions(series: list[GeminiSeriesInput]) -> int:
    return sum(s.question_count for s in series)


def choose_chunk_size(remaining: int, series: list[GeminiSeriesInput]) -> int:
    if remaining <= 1:
        return 1
    if series_needs_tree_hint(series) or remaining >= 12:
        return HEAVY_TOPIC_BATCH_SIZE
    if remaining <= FALLBACK_BATCH_SIZE:
        return remaining
    return FALLBACK_BATCH_SIZE


def build_batch_plan(series: list[GeminiSeriesInput]) -> list[GeminiBatchSlice]:
    """Une seule requête pour toutes les questions ; le découpage intervient après timeout."""
    total = total_questions(series)
    if total <= 0:
        return []
    return [GeminiBatchSlice(from_q=1, count=total)]


def build_chunked_batch_plan(
    series: list[GeminiSeriesInput],
    *,
    from_q: int = 1,
) -> list[GeminiBatchSlice]:
    total = total_questions(series)
    if from_q > total:
        return []
    size = choose_chunk_size(total - from_q + 1, series)
    plan: list[GeminiBatchSlice] = []
    q = from_q
    remaining = total - from_q + 1
    while remaining > 0:
        count = min(size, remaining)
        plan.append(GeminiBatchSlice(from_q=q, count=count))
        q += count
        remaining -= count
    return plan


def plan_to_params(plan: list[GeminiBatchSlice]) -> list[dict]:
    return [{"from_q": b.from_q, "count": b.count} for b in plan]


def plan_from_params(raw: list) -> list[GeminiBatchSlice]:
    return [GeminiBatchSlice(from_q=int(item["from_q"]), count=int(item["count"])) for item in raw]


def completed_batches_after_accept(
    plan: list[GeminiBatchSlice],
    batch_index: int,
    accepted_count: int,
) -> int:
    batch = plan[batch_index]
    last_q = batch.from_q + accepted_count - 1
    completed = batch_index
    for i in range(batch_index, len(plan)):
        end_q = plan[i].from_q + plan[i].count - 1
        if last_q >= end_q:
            completed = i + 1
        else:
            break
    return completed
