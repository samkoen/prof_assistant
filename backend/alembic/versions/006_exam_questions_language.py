"""Langue des questions d'examen (dir accordéon / affichage).

Revision ID: 006
Revises: 005
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not has_column("exams", "questions_language"):
        op.add_column(
            "exams",
            sa.Column("questions_language", sa.String(2), nullable=False, server_default="he"),
        )


def downgrade() -> None:
    op.drop_column("exams", "questions_language")
