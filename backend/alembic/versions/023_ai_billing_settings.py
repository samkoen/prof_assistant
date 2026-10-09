"""Réglages admin des crédits IA.

Revision ID: 023
Revises: 022
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

from app.migration_utils import has_table

revision: str = "023"
down_revision: Union[str, None] = "022"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if has_table("ai_billing_settings"):
        return
    op.create_table(
        "ai_billing_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_free_credits", sa.Integer(), nullable=False),
        sa.Column("teacher_free_credits", sa.Integer(), nullable=False),
        sa.Column("calls_per_teacher_credit", sa.Integer(), nullable=False),
        sa.Column("packs", JSONB(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    if has_table("ai_billing_settings"):
        op.drop_table("ai_billing_settings")
