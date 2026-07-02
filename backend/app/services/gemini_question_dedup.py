import re

JACCARD_THRESHOLD = 0.75
_PREFIX_WORDS = 4

_STRIP_RE = re.compile(r"[`\*✓✔★]", re.UNICODE)
_SPACE_RE = re.compile(r"\s+")


def normalize_stem(text: str) -> str:
    cleaned = _STRIP_RE.sub("", text.lower())
    cleaned = _SPACE_RE.sub(" ", cleaned).strip()
    return cleaned


def jaccard_similarity(a: str, b: str) -> float:
    words_a = set(a.split())
    words_b = set(b.split())
    if not words_a or not words_b:
        return 0.0
    union = words_a | words_b
    return len(words_a & words_b) / len(union)


def stems_too_similar(a: str, b: str) -> bool:
    na = normalize_stem(a)
    nb = normalize_stem(b)
    if not na or not nb:
        return False
    if na == nb:
        return True
    if jaccard_similarity(na, nb) >= JACCARD_THRESHOLD:
        return True
    wa = na.split()
    wb = nb.split()
    if len(wa) >= _PREFIX_WORDS and len(wb) >= _PREFIX_WORDS:
        if wa[:_PREFIX_WORDS] == wb[:_PREFIX_WORDS]:
            return True
    return False


def find_duplicate_against(stem: str, existing: list[str]) -> int | None:
    for idx, other in enumerate(existing):
        if stems_too_similar(stem, other):
            return idx
    return None


def find_duplicate_pairs(stems: list[str]) -> tuple[int, int] | None:
    for i in range(len(stems)):
        for j in range(i + 1, len(stems)):
            if stems_too_similar(stems[i], stems[j]):
                return i, j
    return None
