"""Signature et lecture des réponses PayMe (generate-sale)."""

import hashlib
import hmac

COMPLETED_STATUSES = frozenset({"completed", "success", "paid"})


def payme_signature(secret: str, transaction_id: str, sale_id: str, sale_status: str) -> str:
    message = f"{transaction_id}|{sale_id}|{sale_status}"
    return hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()


def signature_matches(payload: dict, secret: str) -> bool:
    given = str(payload.get("payme_signature") or "").strip()
    if not given or not secret:
        return False
    expected = payme_signature(
        secret,
        str(payload.get("transaction_id") or ""),
        str(payload.get("payme_sale_id") or ""),
        str(payload.get("sale_status") or ""),
    )
    return hmac.compare_digest(expected, given)


def price_matches(payload: dict, amount_agorot: int) -> bool:
    raw = payload.get("price")
    if raw is None or raw == "":
        return True
    amount = int(float(raw))
    return amount in (amount_agorot, amount_agorot // 100)


def parse_sale_url(data: dict) -> str:
    status = data.get("status_code", 0)
    url = str(data.get("sale_url") or "").strip()
    if str(status) not in ("0", "None") or not url:
        raise ValueError("sale_url missing")
    return url
