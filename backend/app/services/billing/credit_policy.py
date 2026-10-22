"""Règle d'une חבילה : remboursement seulement si rien n'a été consommé, sous 14 jours."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

from app.services.billing.constants import ORDER_PAID, REFUND_WINDOW_DAYS
from app.services.utc_time import as_utc

REFUND_REASONS = {
    "not_paid": "ההזמנה לא שולמה",
    "too_late": "עברו 14 יום מהרכישה",
    "used": "חלק מהקרדיטים בחבילה כבר נוצלו",
    "unknown": "אין מעקב אחרי החבילה הזו",
    "no_sale": "אין אסמכתא לתשלום",
}


@dataclass
class PackSlice:
    id: int
    credits: int
    remaining: int | None
    paid_at: datetime | None


def refund_block_reason(
    *,
    status: str,
    paid_at: datetime | None,
    credits: int,
    credits_remaining: int | None,
    payme_sale_id: str | None,
    now: datetime,
) -> str | None:
    if status != ORDER_PAID:
        return "not_paid"
    if paid_at is None or as_utc(now) - as_utc(paid_at) > timedelta(days=REFUND_WINDOW_DAYS):
        return "too_late"
    if credits_remaining is None:
        return "unknown"
    if credits_remaining != credits:
        return "used"
    if not (payme_sale_id or "").strip():
        return "no_sale"
    return None


def consume_paid(rows: list[PackSlice]) -> PackSlice | None:
    """FIFO : le crédit payé le plus ancien est consommé en premier."""
    eligible = [row for row in rows if row.remaining is not None and row.remaining > 0]
    eligible.sort(key=lambda row: (as_utc(row.paid_at) if row.paid_at else as_utc(datetime.min), row.id))
    if not eligible:
        return None
    eligible[0].remaining = (eligible[0].remaining or 0) - 1
    return eligible[0]


def restore_paid(rows: list[PackSlice]) -> PackSlice | None:
    """Rend le crédit à la חבילה entamée la plus récente."""
    partial = [row for row in rows if row.remaining is not None and row.remaining < row.credits]
    partial.sort(key=lambda row: (as_utc(row.paid_at) if row.paid_at else as_utc(datetime.min), row.id), reverse=True)
    if not partial:
        return None
    partial[0].remaining = (partial[0].remaining or 0) + 1
    return partial[0]
