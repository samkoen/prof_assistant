"""Appel HTTP generate-sale. Sans clé, aucun crédit n'est créé."""

import httpx
from fastapi import HTTPException

from app.config import settings

NOT_CONFIGURED = "תשלום PayMe אינו מוגדר"
SALE_REJECTED = "PayMe לא אישר את התשלום"


def payme_ready() -> bool:
    return bool((settings.payme_seller_id or "").strip() and (settings.payme_api_key or "").strip())


def webhook_secret() -> str:
    return (settings.payme_webhook_secret or settings.payme_api_key or "").strip()


def _payme_host() -> str:
    return "sandbox.payme.io" if settings.payme_sandbox else "live.payme.io"


def sale_endpoint() -> str:
    return f"https://{_payme_host()}/api/generate-sale"


def sales_endpoint() -> str:
    return f"https://{_payme_host()}/api/get-sales"


def sale_headers() -> dict[str, str]:
    return {"PayMe-Public-Key": settings.payme_api_key.strip()}


def public_base() -> str:
    raw = (settings.payme_public_base_url or settings.frontend_url or "").strip()
    return raw.rstrip("/")


async def create_sale(body: dict) -> dict:
    if not payme_ready():
        raise HTTPException(status_code=503, detail=NOT_CONFIGURED)
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(sale_endpoint(), json=body, headers=sale_headers())
    try:
        data = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=SALE_REJECTED) from exc
    if response.status_code >= 400 or not isinstance(data, dict):
        raise HTTPException(status_code=502, detail=SALE_REJECTED)
    return data


def listed_sale(data: dict, transaction_id: str) -> dict | None:
    items = data.get("items")
    if not isinstance(items, list):
        return None
    for item in items:
        if isinstance(item, dict) and str(item.get("transaction_id") or "") == transaction_id:
            return item
    return None


async def fetch_sale(transaction_id: str) -> dict | None:
    if not payme_ready() or not transaction_id:
        return None
    body = {"seller_payme_id": settings.payme_seller_id.strip(), "transaction_id": transaction_id}
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(sales_endpoint(), json=body, headers=sale_headers())
        data = response.json()
    except (httpx.HTTPError, ValueError):
        return None
    if response.status_code >= 400 or not isinstance(data, dict):
        return None
    return listed_sale(data, transaction_id)
