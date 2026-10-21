"""Blocage de note pour תרגול et משימה.

Revision ID: 031
Revises: 030
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column

revision: str = "031"
down_revision: Union[str, None] = "030"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if has_column("exam_sessions", "grading_locked"):
        return
    op.add_column(
        "exam_sessions",
        sa.Column("grading_locked", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    if has_column("exam_sessions", "grading_locked"):
        op.drop_column("exam_sessions", "grading_locked")
