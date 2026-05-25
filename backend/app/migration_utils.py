"""Helpers pour migrations Alembic idempotentes (create_all + ALTER successifs)."""
from alembic import op
from sqlalchemy import inspect


def has_table(table: str) -> bool:
    return table in inspect(op.get_bind()).get_table_names()


def has_column(table: str, column: str) -> bool:
    cols = inspect(op.get_bind()).get_columns(table)
    return column in {c["name"] for c in cols}
