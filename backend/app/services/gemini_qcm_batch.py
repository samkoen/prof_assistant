import re
from dataclasses import dataclass

from fastapi import HTTPException

from app.services.gemini_batch_plan import GeminiBatchSlice
from app.services.gemini_question_dedup import find_duplicate_against

_HEADER_RE = re.compile(
    r"^Q(\d+)\b",
    re.IGNORECASE | re.MULTILINE,
)
_OPTION_START_RE = re.compile(r"^[A-D]\)\s*", re.IGNORECASE | re.MULTILINE)


@dataclass(frozen=True)
class BatchValidationResult:
    normalized_raw: str
    stems: list[str]
    accepted_count: int


def split_qcm_blocks(raw: str) -> list[str]:
    parts = re.split(r"^\s*---\s*$", raw.strip(), flags=re.MULTILINE)
    return [p.strip() for p in parts if p.strip()]


def extract_block_stem(block: str) -> str:
    lines = block.splitlines()
    stem_lines: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if _HEADER_RE.match(stripped):
            continue
        if _OPTION_START_RE.match(stripped):
            break
        stem_lines.append(stripped)
    return "\n".join(stem_lines).strip()


def extract_batch_stems(raw: str) -> list[str]:
    return [extract_block_stem(block) for block in split_qcm_blocks(raw)]


def _join_blocks(blocks: list[str]) -> str:
    return "\n---\n".join(blocks)


def _validate_block_header(block: str, expected_q: int, block_index: int) -> None:
    header_line = next((line.strip() for line in block.splitlines() if line.strip()), "")
    match = _HEADER_RE.search(header_line)
    if not match or int(match.group(1)) != expected_q:
        raise HTTPException(
            status_code=502,
            detail=f"מספור שגוי: צפוי Q{expected_q}, התקבל בלוק {block_index + 1}",
        )


def _validate_block_stem(
    block: str,
    expected_q: int,
    prior_stems: list[str],
    stems: list[str],
) -> str:
    stem = extract_block_stem(block)
    if not stem:
        raise HTTPException(status_code=502, detail=f"שאלה Q{expected_q} ללא טקסט")
    dup_idx = find_duplicate_against(stem, prior_stems + stems)
    if dup_idx is not None:
        raise HTTPException(
            status_code=502,
            detail=f"שאלה Q{expected_q} דומה מדי לשאלה קודמת",
        )
    return stem


def _validate_blocks(
    blocks: list[str],
    *,
    from_q: int,
    prior_stems: list[str],
) -> list[str]:
    stems: list[str] = []
    for idx, block in enumerate(blocks):
        expected_q = from_q + idx
        _validate_block_header(block, expected_q, idx)
        stems.append(_validate_block_stem(block, expected_q, prior_stems, stems))
    return stems


def _choose_accept_count(
    block_count: int,
    batch: GeminiBatchSlice,
    *,
    plan_total: int,
) -> int:
    max_accept = plan_total - batch.from_q + 1
    if block_count > max_accept:
        raise HTTPException(
            status_code=502,
            detail=f"המודל החזיר {block_count} שאלות — מקסימום {plan_total} נדרשו",
        )
    if block_count < batch.count:
        raise HTTPException(
            status_code=502,
            detail=f"המודל החזיר {block_count} שאלות — נדרשות לפחות {batch.count} בקבוצה זו",
        )
    if block_count == batch.count:
        return batch.count
    if block_count >= max_accept:
        return max_accept
    return batch.count


def validate_batch_raw(
    raw: str,
    batch: GeminiBatchSlice,
    *,
    prior_stems: list[str],
    plan_total: int,
) -> BatchValidationResult:
    blocks = split_qcm_blocks(raw)
    accept_count = _choose_accept_count(len(blocks), batch, plan_total=plan_total)
    accepted = blocks[:accept_count]
    stems = _validate_blocks(accepted, from_q=batch.from_q, prior_stems=prior_stems)
    return BatchValidationResult(
        normalized_raw=_join_blocks(accepted),
        stems=stems,
        accepted_count=accept_count,
    )


def merge_accumulated_raw(accumulated: str, batch_raw: str) -> str:
    blocks = split_qcm_blocks(batch_raw)
    if not blocks:
        raise HTTPException(status_code=502, detail="תשובה ריקה מהמודל")
    chunk = _join_blocks(blocks)
    acc = accumulated.strip()
    if not acc:
        return f"---\n{chunk}"
    return f"{acc}\n---\n{chunk}"


def stems_from_accumulated(accumulated: str) -> list[str]:
    if not accumulated.strip():
        return []
    return [s for s in extract_batch_stems(accumulated) if s]
