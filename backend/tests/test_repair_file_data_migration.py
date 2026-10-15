import importlib.util
from pathlib import Path

import sqlalchemy as sa


def _load():
    path = Path(__file__).resolve().parents[1] / "alembic" / "versions" / "029_repair_gemini_source_file_data.py"
    spec = importlib.util.spec_from_file_location("repair_file_data_029", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_upgrade_adds_file_data_when_the_column_is_missing(monkeypatch):
    module = _load()
    added: list = []
    monkeypatch.setattr(module, "has_column", lambda table, column: False)
    monkeypatch.setattr(module.op, "add_column", lambda table, column: added.append((table, column)))
    module.upgrade()
    table, column = added[0]
    assert table == "exam_gemini_sources"
    assert column.name == "file_data"
    assert isinstance(column.type, sa.LargeBinary)


def test_upgrade_skips_file_data_when_the_column_exists(monkeypatch):
    module = _load()
    monkeypatch.setattr(module, "has_column", lambda table, column: True)
    monkeypatch.setattr(module.op, "add_column", lambda *_args: (_ for _ in ()).throw(AssertionError("added")))
    module.upgrade()
