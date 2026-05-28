import sqlalchemy as sa
from alembic import op
from typing import Sequence, Union

from app.migration_utils import has_column

"""add ai explanation language to users

Revision ID: 007
Revises: 006
"""


revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not has_column("users", "ai_explanation_language"):
        op.add_column(
            "users",
            sa.Column("ai_explanation_language", sa.String(length=2), nullable=False, server_default="he"),
        )
        op.execute("UPDATE users SET ai_explanation_language = 'he' WHERE ai_explanation_language IS NULL")
        op.alter_column("users", "ai_explanation_language", server_default=None)


def downgrade() -> None:
    if has_column("users", "ai_explanation_language"):
        op.drop_column("users", "ai_explanation_language")
