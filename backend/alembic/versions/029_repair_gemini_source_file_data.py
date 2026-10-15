"""Répare file_data si 024 a été marquée appliquée sans ajouter la colonne.

Revision ID: 029
Revises: 028
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column

revision: str = "029"
down_revision: Union[str, None] = "028"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if has_column("exam_gemini_sources", "file_data"):
        return
    op.add_column("exam_gemini_sources", sa.Column("file_data", sa.LargeBinary(), nullable=True))


def downgrade() -> None:
    if has_column("exam_gemini_sources", "file_data"):
        op.drop_column("exam_gemini_sources", "file_data")
