"""Portée optionnelle sur examens et exercices du catalogue.

Revision ID: 003
Revises: 002
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SCOPE_COLUMNS = (
    ("created_by_id", sa.Integer(), True),
    ("scope_teacher_id", sa.Integer(), False),
    ("scope_academic_year", sa.Integer(), False),
    ("scope_semester", sa.Integer(), False),
    ("scope_group_name", sa.String(255), False),
)


def _add_scope_columns(table: str) -> None:
    for name, col_type, required in _SCOPE_COLUMNS:
        op.add_column(table, sa.Column(name, col_type, nullable=True))
    op.execute(
        f"""
        UPDATE {table} t
        SET created_by_id = c.created_by_id
        FROM course_catalogs c
        WHERE t.catalog_course_id = c.id AND t.created_by_id IS NULL
        """
    )
    op.alter_column(table, "created_by_id", nullable=False)
    op.create_foreign_key(f"fk_{table}_created_by_id", table, "users", ["created_by_id"], ["id"])
    op.create_foreign_key(
        f"fk_{table}_scope_teacher_id", table, "users", ["scope_teacher_id"], ["id"]
    )
    op.create_index(f"ix_{table}_created_by_id", table, ["created_by_id"])
    op.create_index(f"ix_{table}_scope_teacher_id", table, ["scope_teacher_id"])
    op.create_index(f"ix_{table}_scope_academic_year", table, ["scope_academic_year"])
    op.create_index(f"ix_{table}_scope_semester", table, ["scope_semester"])


def upgrade() -> None:
    _add_scope_columns("exams")
    _add_scope_columns("exercises")


def downgrade() -> None:
    for table in ("exercises", "exams"):
        op.drop_constraint(f"fk_{table}_scope_teacher_id", table, type_="foreignkey")
        op.drop_constraint(f"fk_{table}_created_by_id", table, type_="foreignkey")
        for name, _, _ in reversed(_SCOPE_COLUMNS):
            op.drop_column(table, name)
