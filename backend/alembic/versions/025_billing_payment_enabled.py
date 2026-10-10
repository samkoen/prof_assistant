"""Interrupteur admin : les crédits IA sont-ils débités ?

Revision ID: 025
Revises: 024
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column

revision: str = "025"
down_revision: Union[str, None] = "024"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if has_column("ai_billing_settings", "payment_enabled"):
        return
    op.add_column(
        "ai_billing_settings",
        sa.Column("payment_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    if has_column("ai_billing_settings", "payment_enabled"):
        op.drop_column("ai_billing_settings", "payment_enabled")
