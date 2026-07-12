"""Point d'entrée unique pour les appels AI (Gemini ou OpenCode Go)."""

import logging
import time
from typing import Literal

from app.config import settings

logger = logging.getLogger(__name__)

AiProvider = Literal["gemini", "opencode"]


class AiError(Exception):
    """Erreur fournisseur AI (Gemini ou OpenCode)."""


def ai_provider(*, for_generation: bool = False) -> AiProvider:
    return settings.ai_provider_for(for_generation=for_generation)


def uses_gemini(*, for_generation: bool = False) -> bool:
    return ai_provider(for_generation=for_generation) == "gemini"


def _audience(for_generation: bool) -> str:
    return "teacher" if for_generation else "student"


def _opencode_configured() -> bool:
    return bool(
        (settings.opencode_api_key or "").strip()
        or (settings.opencode_server_url or "").strip()
    )


def _is_gemini_auth_failure(exc: BaseException) -> bool:
    from app.services.gemini_client import GeminiError

    cause = exc.__cause__ if isinstance(exc, AiError) else exc
    if isinstance(cause, GeminiError):
        return cause.auth_failure
    message = str(exc)
    return "מפתח Gemini" in message or "GEMINI_API_KEY" in message


def _should_fallback_to_opencode(exc: AiError, *, for_generation: bool) -> bool:
    return (
        for_generation
        and _is_gemini_auth_failure(exc)
        and _opencode_configured()
    )


def _gemini_timeouts(*, for_generation: bool, timeout_seconds: float | None) -> float:
    if timeout_seconds is not None:
        return timeout_seconds
    if for_generation:
        return settings.gemini_generation_timeout_seconds
    return settings.gemini_timeout_seconds


def _gemini_max_tokens(for_generation: bool) -> int | None:
    if for_generation:
        return settings.gemini_generation_max_output_tokens
    return None


def _generation_system(*, for_generation: bool) -> str:
    if uses_gemini(for_generation=for_generation):
        return (
            "You generate exam questions in the exact format requested. "
            "Reply as the Assistant only. Text only."
        )
    from app.services.opencode_errors import generation_system

    return generation_system()


def _describe_ai_call(for_generation: bool) -> tuple[str, str, str, str]:
    audience = _audience(for_generation)
    provider = ai_provider(for_generation=for_generation)
    if provider == "gemini":
        model = settings.gemini_model.strip() or "gemini-2.0-flash"
        transport = "gemini-api"
    else:
        model = settings.opencode_model_id
        transport = "opencode-cloud" if (settings.opencode_api_key or "").strip() else "opencode-local"
    return audience, provider, model, transport


def _log_ai_call_start(*, mode: str, for_generation: bool) -> None:
    audience, provider, model, transport = _describe_ai_call(for_generation)
    logger.info(
        "AI call start | role=%s | provider=%s | model=%s | transport=%s | mode=%s",
        audience,
        provider,
        model,
        transport,
        mode,
    )


def _log_ai_call_done(
    *,
    mode: str,
    for_generation: bool,
    started: float,
    ok: bool,
    output_chars: int = 0,
) -> None:
    audience, provider, model, transport = _describe_ai_call(for_generation)
    elapsed_ms = int((time.monotonic() - started) * 1000)
    status = "ok" if ok else "error"
    logger.info(
        "AI call %s | role=%s | provider=%s | model=%s | transport=%s | mode=%s | %sms | chars=%s",
        status,
        audience,
        provider,
        model,
        transport,
        mode,
        elapsed_ms,
        output_chars,
    )


async def _generate_text_gemini(
    prompt: str,
    *,
    system: str | None,
    timeout_seconds: float | None,
    for_generation: bool,
) -> str:
    from app.services.gemini_client import GeminiError, generate_text as gemini_text

    try:
        return await gemini_text(
            prompt,
            max_output_tokens=_gemini_max_tokens(for_generation),
            timeout_seconds=_gemini_timeouts(
                for_generation=for_generation,
                timeout_seconds=timeout_seconds,
            ),
            use_generation_fallbacks=for_generation,
            system_instruction=system
            or (_generation_system(for_generation=for_generation) if for_generation else None),
        )
    except GeminiError as exc:
        raise AiError(str(exc)) from exc


async def _generate_text_opencode(
    prompt: str,
    *,
    system: str | None,
    timeout_seconds: float | None,
    for_generation: bool,
) -> str:
    from app.services.opencode_client import OpenCodeError, generate_text as opencode_text

    try:
        return await opencode_text(
            prompt,
            system=system,
            timeout_seconds=timeout_seconds,
            for_generation=for_generation,
        )
    except OpenCodeError as exc:
        raise AiError(str(exc)) from exc


async def _generate_text_with_opencode_fallback(
    prompt: str,
    *,
    system: str | None,
    timeout_seconds: float | None,
    for_generation: bool,
) -> str:
    try:
        return await _generate_text_gemini(
            prompt,
            system=system,
            timeout_seconds=timeout_seconds,
            for_generation=for_generation,
        )
    except AiError as exc:
        if not _should_fallback_to_opencode(exc, for_generation=for_generation):
            raise
        logger.warning(
            "Gemini auth failed for teacher generation; falling back to OpenCode: %s",
            exc,
        )
        return await _generate_text_opencode(
            prompt,
            system=system,
            timeout_seconds=timeout_seconds,
            for_generation=for_generation,
        )


async def _generate_chat_gemini(
    contents: list[dict],
    *,
    system: str | None,
    timeout_seconds: float | None,
    for_generation: bool,
) -> str:
    from app.services.gemini_client import GeminiError, generate_chat as gemini_chat

    try:
        return await gemini_chat(
            contents,
            max_output_tokens=_gemini_max_tokens(for_generation),
            timeout_seconds=_gemini_timeouts(
                for_generation=for_generation,
                timeout_seconds=timeout_seconds,
            ),
            use_generation_fallbacks=for_generation,
            system_instruction=system
            or (_generation_system(for_generation=for_generation) if for_generation else None),
        )
    except GeminiError as exc:
        raise AiError(str(exc)) from exc


async def _generate_chat_opencode(
    contents: list[dict],
    *,
    system: str | None,
    timeout_seconds: float | None,
    for_generation: bool,
) -> str:
    from app.services.opencode_client import OpenCodeError, generate_chat as opencode_chat

    try:
        return await opencode_chat(
            contents,
            system=system,
            timeout_seconds=timeout_seconds,
            for_generation=for_generation,
        )
    except OpenCodeError as exc:
        raise AiError(str(exc)) from exc


async def _generate_chat_with_opencode_fallback(
    contents: list[dict],
    *,
    system: str | None,
    timeout_seconds: float | None,
    for_generation: bool,
) -> str:
    try:
        return await _generate_chat_gemini(
            contents,
            system=system,
            timeout_seconds=timeout_seconds,
            for_generation=for_generation,
        )
    except AiError as exc:
        if not _should_fallback_to_opencode(exc, for_generation=for_generation):
            raise
        logger.warning(
            "Gemini auth failed for teacher generation; falling back to OpenCode: %s",
            exc,
        )
        return await _generate_chat_opencode(
            contents,
            system=system,
            timeout_seconds=timeout_seconds,
            for_generation=for_generation,
        )


async def generate_text(
    prompt: str,
    *,
    system: str | None = None,
    timeout_seconds: float | None = None,
    for_generation: bool = False,
) -> str:
    started = time.monotonic()
    _log_ai_call_start(mode="text", for_generation=for_generation)
    try:
        if uses_gemini(for_generation=for_generation):
            text = await _generate_text_with_opencode_fallback(
                prompt,
                system=system,
                timeout_seconds=timeout_seconds,
                for_generation=for_generation,
            )
        else:
            text = await _generate_text_opencode(
                prompt,
                system=system,
                timeout_seconds=timeout_seconds,
                for_generation=for_generation,
            )
    except AiError:
        _log_ai_call_done(mode="text", for_generation=for_generation, started=started, ok=False)
        raise
    _log_ai_call_done(
        mode="text",
        for_generation=for_generation,
        started=started,
        ok=True,
        output_chars=len(text),
    )
    return text


async def generate_chat(
    contents: list[dict],
    *,
    system: str | None = None,
    timeout_seconds: float | None = None,
    for_generation: bool = False,
) -> str:
    started = time.monotonic()
    _log_ai_call_start(mode="chat", for_generation=for_generation)
    try:
        if uses_gemini(for_generation=for_generation):
            text = await _generate_chat_with_opencode_fallback(
                contents,
                system=system,
                timeout_seconds=timeout_seconds,
                for_generation=for_generation,
            )
        else:
            text = await _generate_chat_opencode(
                contents,
                system=system,
                timeout_seconds=timeout_seconds,
                for_generation=for_generation,
            )
    except AiError:
        _log_ai_call_done(mode="chat", for_generation=for_generation, started=started, ok=False)
        raise
    _log_ai_call_done(
        mode="chat",
        for_generation=for_generation,
        started=started,
        ok=True,
        output_chars=len(text),
    )
    return text
