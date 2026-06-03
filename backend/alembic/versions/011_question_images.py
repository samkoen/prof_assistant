"""question and option image_url columns

Revision ID: 011
Revises: 010
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column

revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not has_column("questions", "image_url"):
        op.add_column("questions", sa.Column("image_url", sa.String(512), nullable=True))
    if not has_column("question_options", "image_url"):
        op.add_column("question_options", sa.Column("image_url", sa.String(512), nullable=True))


def downgrade() -> None:
    if has_column("question_options", "image_url"):
        op.drop_column("question_options", "image_url")
    if has_column("questions", "image_url"):
        op.drop_column("questions", "image_url")
