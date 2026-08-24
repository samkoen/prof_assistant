from app.services.opencode_cloud_client import _map_openai_error
from app.services.opencode_errors import (
    REGION_BLOCKED_HE,
    build_model_chain,
    is_region_blocked_text,
)


def test_region_error_is_detected():
    raw = (
        "Error code: 403 - {'type': 'error', 'error': {'type': 'RegionError', "
        "'message': 'The latest version of this model is only available hosted in China "
        "and requires explicit opt in: https://opencode.ai/wo'}}"
    )
    assert is_region_blocked_text(raw)
    mapped = _map_openai_error(Exception(raw))  # type: ignore[arg-type]
    assert mapped.region_blocked
    assert mapped.retryable is False
    assert "סין" in str(mapped)
    assert "https://opencode.ai" not in str(mapped)


def test_model_chain_primary_then_fallbacks():
    chain = build_model_chain("deepseek-v4-flash", "mimo-v2.5,glm-5.1")
    assert chain[0] == "deepseek-v4-flash"
    assert "mimo-v2.5" in chain
    assert chain == ["deepseek-v4-flash", "mimo-v2.5", "glm-5.1"]


def test_model_chain_skips_duplicates_and_empty():
    chain = build_model_chain("mimo-v2.5", "mimo-v2.5, glm-5.1, ")
    assert chain == ["mimo-v2.5", "glm-5.1"]
    assert build_model_chain("", "") == ["mimo-v2.5"]
    assert REGION_BLOCKED_HE
