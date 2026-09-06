"""Test rapide clé Gemini. Usage: python scripts/test_gemini_key.py"""
import asyncio
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings

BASE = "https://generativelanguage.googleapis.com/v1beta/models"
TEST_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
    "gemini-1.5-flash",
]


async def list_models(key: str) -> None:
    url = f"{BASE}?key={key}"
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url)
    print(f"LIST models: HTTP {response.status_code}")
    if response.status_code != 200:
        print(response.text[:400])
        return
    names = [m.get("name", "") for m in response.json().get("models", [])[:10]]
    print("Exemples de modèles disponibles:", names)


async def try_model(key: str, model: str) -> None:
    url = f"{BASE}/{model}:generateContent?key={key}"
    body = {"contents": [{"role": "user", "parts": [{"text": "Réponds uniquement: OK"}]}]}
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(url, json=body)
    if response.status_code == 200:
        print(f"  {model}: OK")
        return
    try:
        detail = response.json().get("error", {}).get("message", response.text)
    except Exception:
        detail = response.text
    print(f"  {model}: HTTP {response.status_code} — {str(detail)[:220]}")


async def main() -> None:
    key = (settings.gemini_api_key or "").strip()
    print(f"AI_PROVIDER={settings.ai_provider}")
    print(f"AI_PROVIDER_TEACHER={settings.ai_provider_teacher or settings.ai_provider}")
    print(f"AI_PROVIDER_STUDENT={settings.ai_provider_student or settings.ai_provider}")
    print(f"GEMINI_MODEL={settings.gemini_model}")
    print(f"GEMINI_MODEL_TEACHER={settings.gemini_primary_model(for_generation=True)}")
    print(f"GEMINI_MODEL_STUDENT={settings.gemini_primary_model(for_generation=False)}")
    if not key:
        print("ERREUR: GEMINI_API_KEY manquant dans backend/.env")
        sys.exit(1)
    print(f"Clé: prefix={key[:8]}… len={len(key)}")
    if not key.startswith("AIza"):
        print("AVERTISSEMENT: format inhabituel (Google AI Studio = AIzaSy…)")
    await list_models(key)
    print("Test generateContent:")
    for model in TEST_MODELS:
        await try_model(key, model)


if __name__ == "__main__":
    asyncio.run(main())
