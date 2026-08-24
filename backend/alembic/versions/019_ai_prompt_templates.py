"""Questions ouvertes : bonne réponse partagée + appréciation par élève.

Revision ID: 019
Revises: 018
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_table

revision: str = "019"
down_revision: Union[str, None] = "018"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if has_table("ai_prompt_templates"):
        return
    op.create_table(
        "ai_prompt_templates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(length=80), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
    )
    op.create_index("ix_ai_prompt_templates_key", "ai_prompt_templates", ["key"], unique=True)


def downgrade() -> None:
    if has_table("ai_prompt_templates"):
        op.drop_index("ix_ai_prompt_templates_key", table_name="ai_prompt_templates")
        op.drop_table("ai_prompt_templates")
