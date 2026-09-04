"""Flag תרגול vs מבחן רשמי sur l'examen.

Revision ID: 020
Revises: 019
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column

revision: str = "020"
down_revision: Union[str, None] = "019"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not has_column("exams", "is_tirgoul"):
        op.add_column(
            "exams",
            sa.Column("is_tirgoul", sa.Boolean(), nullable=False, server_default=sa.false()),
        )


def downgrade() -> None:
    if has_column("exams", "is_tirgoul"):
        op.drop_column("exams", "is_tirgoul")
