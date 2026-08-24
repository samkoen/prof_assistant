class OpenCodeError(Exception):
    def __init__(
        self,
        message: str,
        *,
        retryable: bool = True,
        region_blocked: bool = False,
    ) -> None:
        super().__init__(message)
        self.retryable = retryable
        self.region_blocked = region_blocked


REGION_BLOCKED_HE = (
    "מודל OpenCode זה מאוחסן בסין ודורש אישור ידני. "
    "עדכנו OPENCODE_MODEL_ID ל-mimo-v2.5."
)


def generation_system() -> str:
    from app.services.ai_prompt_store import get_prompt_body

    return get_prompt_body("generation.system")


def is_region_blocked_text(text: str) -> bool:
    lowered = (text or "").lower()
    return (
        "regionerror" in lowered
        or "hosted in china" in lowered
        or "explicit opt in" in lowered
    )


def build_model_chain(primary: str, fallbacks: str) -> list[str]:
    extras = [m.strip() for m in (fallbacks or "").split(",") if m.strip()]
    out: list[str] = []
    for name in [(primary or "").strip(), *extras]:
        if name and name not in out:
            out.append(name)
    return out or ["mimo-v2.5"]


def model_chain() -> list[str]:
    from app.config import settings

    return build_model_chain(settings.opencode_model_id, settings.opencode_fallback_models)


def run_profile(*, for_generation: bool) -> dict[str, str | float]:
    from app.config import settings

    timeout = settings.opencode_timeout_seconds
    if for_generation:
        return {
            "model_id": settings.opencode_model_id,
            "agent": settings.opencode_agent,
            "session_title": settings.opencode_generation_session_title,
            "timeout": timeout,
        }
    return {
        "model_id": settings.opencode_model_id,
        "agent": settings.opencode_agent,
        "session_title": settings.opencode_session_title,
        "timeout": timeout,
    }
