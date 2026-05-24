"""Service email (Resend) — stub en dev."""

from app.config import settings


async def send_verification_email(email: str, token: str) -> bool:
    if not settings.resend_api_key:
        print(f"[DEV] Email verification for {email}: token={token}")
        return True
    # TODO: intégration Resend API
    return True
