from datetime import datetime, timedelta, timezone

from app.services.billing.constants import ORDER_PAID, REFUND_WINDOW_DAYS
from app.services.billing.credit_policy import PackSlice, consume_paid, refund_block_reason, restore_paid

NOW = datetime(2026, 10, 22, tzinfo=timezone.utc)


def _reason(**overrides):
    fields = {
        "status": ORDER_PAID,
        "paid_at": NOW - timedelta(days=2),
        "credits": 20,
        "credits_remaining": 20,
        "payme_sale_id": "SALE1",
        "now": NOW,
    }
    fields.update(overrides)
    return refund_block_reason(**fields)


def test_full_pack_inside_the_window_can_be_refunded():
    assert _reason() is None


def test_refund_refused_after_14_days_or_once_a_credit_was_used():
    assert _reason(paid_at=NOW - timedelta(days=REFUND_WINDOW_DAYS, seconds=1)) == "too_late"
    assert _reason(credits_remaining=19) == "used"
    assert _reason(credits_remaining=None) == "unknown"


def test_paid_credits_are_consumed_oldest_first_and_restored_to_that_pack():
    older = PackSlice(1, 5, 5, NOW - timedelta(days=3))
    newer = PackSlice(2, 15, 15, NOW - timedelta(days=1))
    consumed = consume_paid([newer, older])
    assert consumed is older
    assert older.remaining == 4
    assert newer.remaining == 15
    restored = restore_paid([older, newer])
    assert restored is older
    assert older.remaining == 5
