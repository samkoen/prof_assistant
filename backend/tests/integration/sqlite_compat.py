"""SQLite ne connaît pas JSONB : on le compile en JSON pour create_all / DML."""

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles


@compiles(JSONB, "sqlite")
def _jsonb_as_json_sqlite(element, compiler, **kw):
    return "JSON"
