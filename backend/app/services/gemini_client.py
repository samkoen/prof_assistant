import asyncio
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
_TRANSIENT_STATUSES = frozenset({429, 503, 529})


class GeminiError(Exception):
    pass


def _extract_text(payload: dict) -> str:
    candidates = payload.get("candidates") or []
    if not candidates:
        raise GeminiError("אין תשובה מהמודל")
    candidate = candidates[0]
    parts = (candidate.get("content") or {}).get("parts") or []
    texts = [
        p["text"]
        for p in parts
        if not p.get("thought") and isinstance(p.get("text"), str) and p["text"].strip()
    ]
    if not texts:
        raise GeminiError("תשובה ריקה מהמודל")
    text = "\n".join(texts).strip()
    if candidate.get("finishReason") == "MAX_TOKENS":
        logger.warning("Gemini response truncated (MAX_TOKENS), len=%s", len(text))
    return text


def _generation_config(max_output_tokens: int | None = None) -> dict:
    cfg: dict = {
        "temperature": settings.gemini_temperature,
        "maxOutputTokens": max_output_tokens or settings.gemini_max_output_tokens,
    }
    if settings.gemini_thinking_budget >= 0:
        cfg["thinkingConfig"] = {"thinkingBudget": settings.gemini_thinking_budget}
    return cfg


def _parse_models_csv(raw: str) -> list[str]:
    return [m.strip() for m in raw.split(",") if m.strip()]


def _models_chain(primary: str, *, use_generation_fallbacks: bool) -> list[str]:
    chain = [primary.strip() or "gemini-2.0-flash"]
    extra = (
        settings.gemini_generation_fallback_models
        if use_generation_fallbacks
        else settings.gemini_fallback_models
    )
    for model in _parse_models_csv(extra):
        if model not in chain:
            chain.append(model)
    return chain


def _parse_api_error(response: httpx.Response) -> str:
    try:
        payload = response.json()
        err = payload.get("error") or {}
        return str(err.get("message") or response.text[:300])
    except Exception:
        return response.text[:300]


def _user_message(status: int, model: str, detail: str) -> str:
    detail_lower = detail.lower()
    if status == 404:
        return f"המודל '{model}' לא זמין. עדכן GEMINI_MODEL (למשל gemini-2.0-flash)."
    if status == 429:
        return "מכסת Gemini נגמרה — בדוק ב-AI Studio את החיוב והמכסה."
    if status in (401, 403):
        return "מפתח Gemini לא תקין או ללא הרשאה."
    if status in _TRANSIENT_STATUSES or "high demand" in detail_lower:
        return "שירות Gemini עמוס כרגע — המערכת ניסתה שוב; נסו בעוד דקה."
    return "שגיאה בשירות הבינה המלאכותית"


def _is_transient(status: int, detail: str) -> bool:
    if status in _TRANSIENT_STATUSES:
        return True
    lowered = detail.lower()
    return "high demand" in lowered or "overloaded" in lowered or "unavailable" in lowered


async def _post_generate(
    model: str, api_key: str, body: dict, timeout: float
) -> httpx.Response:
    url = f"{_GEMINI_BASE}/{model}:generateContent"
    async with httpx.AsyncClient(timeout=timeout) as client:
        return await client.post(url, params={"key": api_key}, json=body)


async def _request_once(
    model: str, api_key: str, body: dict, timeout: float
) -> str:
    response = await _post_generate(model, api_key, body, timeout)
    if response.status_code >= 400:
        detail = _parse_api_error(response)
        logger.warning("Gemini API %s model=%s: %s", response.status_code, model, detail)
        raise GeminiError(_user_message(response.status_code, model, detail))
    return _extract_text(response.json())


async def _request_with_retries(
    model: str, api_key: str, body: dict, timeout: float
) -> str:
    retries = max(0, settings.gemini_retry_count)
    delay = settings.gemini_retry_delay_seconds
    last: GeminiError | None = None
    for attempt in range(retries + 1):
        try:
            return await _request_once(model, api_key, body, timeout)
        except GeminiError as exc:
            last = exc
            if attempt >= retries:
                break
            await asyncio.sleep(delay * (attempt + 1))
    assert last is not None
    raise last


async def _generate_across_models(
    models: list[str], api_key: str, body: dict, timeout: float
) -> str:
    last_error: GeminiError | None = None
    for model in models:
        try:
            return await _request_with_retries(model, api_key, body, timeout)
        except GeminiError as exc:
            last_error = exc
            if model != models[-1]:
                logger.info("Gemini fallback: %s failed, trying next model", model)
    assert last_error is not None
    raise last_error


def _chat_body(
    contents: list[dict],
    *,
    max_output_tokens: int | None,
) -> dict:
    return {
        "contents": contents,
        "generationConfig": _generation_config(max_output_tokens),
    }


async def _generate_with_body(
    body: dict,
    *,
    timeout_seconds: float | None,
    use_generation_fallbacks: bool,
) -> str:
    api_key = (settings.gemini_api_key or "").strip()
    if not api_key:
        raise GeminiError("שירות ההסבר אינו מוגדר")
    primary = settings.gemini_model.strip() or "gemini-2.0-flash"
    timeout = timeout_seconds or settings.gemini_timeout_seconds
    models = _models_chain(primary, use_generation_fallbacks=use_generation_fallbacks)
    return await _generate_across_models(models, api_key, body, timeout)


async def generate_text(
    prompt: str,
    *,
    max_output_tokens: int | None = None,
    timeout_seconds: float | None = None,
    use_generation_fallbacks: bool = False,
) -> str:
    body = _chat_body(
        [{"role": "user", "parts": [{"text": prompt}]}],
        max_output_tokens=max_output_tokens,
    )
    return await _generate_with_body(
        body,
        timeout_seconds=timeout_seconds,
        use_generation_fallbacks=use_generation_fallbacks,
    )


async def generate_chat(
    contents: list[dict],
    *,
    max_output_tokens: int | None = None,
    timeout_seconds: float | None = None,
    use_generation_fallbacks: bool = False,
) -> str:
    body = _chat_body(contents, max_output_tokens=max_output_tokens)
    return await _generate_with_body(
        body,
        timeout_seconds=timeout_seconds,
        use_generation_fallbacks=use_generation_fallbacks,
    )
