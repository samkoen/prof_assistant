from sqlalchemy.exc import NoSuchTableError

from app import migration_utils as mu


class _Inspector:
    def __init__(self, tables: list[str], columns: dict[str, list[str]] | None = None, boom: bool = False):
        self._tables = tables
        self._columns = columns or {}
        self._boom = boom

    def get_table_names(self):
        return self._tables

    def get_columns(self, table: str):
        if self._boom:
            raise NoSuchTableError(table)
        return [{"name": name} for name in self._columns.get(table, [])]


def test_has_column_is_false_when_table_is_missing(monkeypatch):
    monkeypatch.setattr(mu, "inspect", lambda _bind: _Inspector([]))
    monkeypatch.setattr(mu.op, "get_bind", lambda: None)
    assert mu.has_column("ai_billing_settings", "payment_enabled") is False


def test_has_column_is_false_when_inspect_raises(monkeypatch):
    monkeypatch.setattr(mu, "inspect", lambda _bind: _Inspector(["ai_billing_settings"], boom=True))
    monkeypatch.setattr(mu.op, "get_bind", lambda: None)
    assert mu.has_column("ai_billing_settings", "payment_enabled") is False


def test_has_column_finds_existing_column(monkeypatch):
    inspector = _Inspector(["ai_billing_settings"], {"ai_billing_settings": ["id", "payment_enabled"]})
    monkeypatch.setattr(mu, "inspect", lambda _bind: inspector)
    monkeypatch.setattr(mu.op, "get_bind", lambda: None)
    assert mu.has_column("ai_billing_settings", "payment_enabled") is True
    assert mu.has_column("ai_billing_settings", "missing") is False
