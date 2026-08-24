from datetime import datetime, timezone

from app.services.utc_time import as_utc


def test_as_utc_adds_utc_to_naive():
    naive = datetime(2026, 1, 1, 12, 0, 0)
    aware = as_utc(naive)
    assert aware.tzinfo == timezone.utc
    assert datetime.now(timezone.utc) > aware
