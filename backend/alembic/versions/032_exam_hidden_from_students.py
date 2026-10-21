"""Masquer une מטלה aux élèves sans la supprimer.

Revision ID: 032
Revises: 031
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column

revision: str = "032"
down_revision: Union[str, None] = "031"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if has_column("exams", "hidden_from_students"):
        return
    op.add_column(
        "exams",
        sa.Column("hidden_from_students", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    if has_column("exams", "hidden_from_students"):
        op.drop_column("exams", "hidden_from_students")
