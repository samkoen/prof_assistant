"""Helpers pour migrations Alembic idempotentes (create_all + ALTER successifs)."""
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.exc import NoSuchTableError


def has_table(table: str) -> bool:
    return table in inspect(op.get_bind()).get_table_names()


def has_column(table: str, column: str) -> bool:
    """Faux si la table n'existe pas : `get_columns` lève sinon NoSuchTableError."""
    if not has_table(table):
        return False
    try:
        cols = inspect(op.get_bind()).get_columns(table)
    except NoSuchTableError:
        return False
    return column in {c["name"] for c in cols}
