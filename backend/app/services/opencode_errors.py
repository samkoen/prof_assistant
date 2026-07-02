class OpenCodeError(Exception):
    def __init__(self, message: str, *, retryable: bool = True) -> None:
        super().__init__(message)
        self.retryable = retryable


_GENERATION_SYSTEM = (
    "You generate exam questions in the exact format requested. "
    "Reply as the Assistant only. Text only, no tools."
)


def generation_system() -> str:
    return _GENERATION_SYSTEM


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
