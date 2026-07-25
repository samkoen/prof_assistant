"""Lien créateur (prof) sur les comptes élèves.

Revision ID: 017
Revises: 016
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column

revision: str = "017"
down_revision: Union[str, None] = "016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not has_column("users", "created_by_id"):
        op.add_column(
            "users",
            sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        )
        op.create_index("ix_users_created_by_id", "users", ["created_by_id"])


def downgrade() -> None:
    if has_column("users", "created_by_id"):
        op.drop_index("ix_users_created_by_id", table_name="users")
        op.drop_column("users", "created_by_id")
