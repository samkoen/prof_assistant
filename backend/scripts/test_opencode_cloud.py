"""Test rapide OpenCode cloud (OPENCODE_API_KEY). Usage: python scripts/test_opencode_cloud.py"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.services.opencode_client import OpenCodeError, generate_text


async def main() -> None:
    key_set = bool((settings.opencode_api_key or "").strip())
    print(f"Mode cloud: {key_set}")
    print(f"Base URL: {settings.opencode_api_base_url}")
    print(f"Model: {settings.opencode_model_id}")
    if not key_set:
        print("ERREUR: OPENCODE_API_KEY manquant dans backend/.env")
        sys.exit(1)
    try:
        text = await generate_text(
            "Réponds en une phrase courte en français : qu'est-ce qu'une boucle for ?",
            timeout_seconds=90,
        )
    except OpenCodeError as exc:
        print(f"ERREUR OpenCode: {exc}")
        sys.exit(1)
    print("Réponse OK:")
    print(text[:500])


if __name__ == "__main__":
    asyncio.run(main())
