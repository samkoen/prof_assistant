"""Interrupteur admin : les crédits IA sont-ils débités ?

Revision ID: 025
Revises: 024
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

from app.migration_utils import has_column, has_table

revision: str = "025"
down_revision: Union[str, None] = "024"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _create_settings_table() -> None:
    op.create_table(
        "ai_billing_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_free_credits", sa.Integer(), nullable=False),
        sa.Column("teacher_free_credits", sa.Integer(), nullable=False),
        sa.Column("calls_per_teacher_credit", sa.Integer(), nullable=False),
        sa.Column("packs", JSONB(), nullable=False),
        sa.Column("payment_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def upgrade() -> None:
    # 023 a pu être marquée appliquée sans créer la table (stamp / skip).
    if not has_table("ai_billing_settings"):
        _create_settings_table()
        return
    if has_column("ai_billing_settings", "payment_enabled"):
        return
    op.add_column(
        "ai_billing_settings",
        sa.Column("payment_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    if has_column("ai_billing_settings", "payment_enabled"):
        op.drop_column("ai_billing_settings", "payment_enabled")
