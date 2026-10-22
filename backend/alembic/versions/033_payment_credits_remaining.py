"""Suivi des crédits encore intacts sur chaque חבילה payée.

Revision ID: 033
Revises: 032
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column

revision: str = "033"
down_revision: Union[str, None] = "032"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if has_column("payment_orders", "credits_remaining"):
        return
    op.add_column("payment_orders", sa.Column("credits_remaining", sa.Integer(), nullable=True))


def downgrade() -> None:
    if has_column("payment_orders", "credits_remaining"):
        op.drop_column("payment_orders", "credits_remaining")
