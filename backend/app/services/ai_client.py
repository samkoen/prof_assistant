"""Point d'entrée unique pour les appels AI (Gemini ou OpenCode Go)."""

import logging
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


def _model_label(*, for_generation: bool) -> str:
    if uses_gemini(for_generation=for_generation):
        primary = settings.gemini_model.strip() or "gemini-2.0-flash"
        fallbacks = (
            settings.gemini_generation_fallback_models
            if for_generation
            else settings.gemini_fallback_models
        )
        return f"{primary} (fallbacks: {fallbacks})"
    transport = "cloud" if (settings.opencode_api_key or "").strip() else "local-serve"
    return f"{settings.opencode_model_id} ({transport})"


def _log_ai_call(*, mode: str, for_generation: bool) -> None:
    logger.info(
        "AI call audience=%s provider=%s mode=%s for_generation=%s model=%s",
        _audience(for_generation),
        ai_provider(for_generation=for_generation),
        mode,
        for_generation,
        _model_label(for_generation=for_generation),
    )


async def generate_text(
    prompt: str,
    *,
    system: str | None = None,
    timeout_seconds: float | None = None,
    for_generation: bool = False,
) -> str:
    _log_ai_call(mode="text", for_generation=for_generation)
    if uses_gemini(for_generation=for_generation):
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


async def generate_chat(
    contents: list[dict],
    *,
    system: str | None = None,
    timeout_seconds: float | None = None,
    for_generation: bool = False,
) -> str:
    _log_ai_call(mode="chat", for_generation=for_generation)
    if uses_gemini(for_generation=for_generation):
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
