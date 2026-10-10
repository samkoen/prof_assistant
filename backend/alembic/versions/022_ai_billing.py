"""Portefeuilles IA, usages et commandes PayMe.

Revision ID: 022
Revises: 021
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_table

revision: str = "022"
down_revision: Union[str, None] = "021"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not has_table("ai_wallets"):
        op.create_table(
            "ai_wallets",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("product", sa.String(32), nullable=False),
            sa.Column("free_remaining", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("paid_remaining", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.UniqueConstraint("user_id", "product", name="uq_ai_wallets_user_product"),
        )
        op.create_index("ix_ai_wallets_user_id", "ai_wallets", ["user_id"])
        op.create_index("ix_ai_wallets_product", "ai_wallets", ["product"])
    if not has_table("ai_usages"):
        op.create_table(
            "ai_usages",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("product", sa.String(32), nullable=False),
            sa.Column("status", sa.String(20), nullable=False),
            sa.Column("generation_session_id", sa.Integer(), nullable=True),
            sa.Column("slots_total", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("slots_used", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("charged_bucket", sa.String(10), nullable=False, server_default="free"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )
        op.create_index("ix_ai_usages_user_id", "ai_usages", ["user_id"])
        op.create_index("ix_ai_usages_product", "ai_usages", ["product"])
        op.create_index("ix_ai_usages_status", "ai_usages", ["status"])
        op.create_index("ix_ai_usages_generation_session_id", "ai_usages", ["generation_session_id"])
    if not has_table("payment_orders"):
        op.create_table(
            "payment_orders",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("pack_code", sa.String(40), nullable=False),
            sa.Column("product", sa.String(32), nullable=False),
            sa.Column("credits", sa.Integer(), nullable=False),
            sa.Column("amount_agorot", sa.Integer(), nullable=False),
            sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
            sa.Column("transaction_id", sa.String(64), nullable=False),
            sa.Column("payme_sale_id", sa.String(80), nullable=True),
            sa.Column("payme_transaction_id", sa.String(80), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
            sa.UniqueConstraint("transaction_id", name="uq_payment_orders_transaction_id"),
            sa.UniqueConstraint("payme_sale_id", name="uq_payment_orders_payme_sale_id"),
        )
        op.create_index("ix_payment_orders_user_id", "payment_orders", ["user_id"])
        op.create_index("ix_payment_orders_status", "payment_orders", ["status"])
        op.create_index("ix_payment_orders_transaction_id", "payment_orders", ["transaction_id"])


def downgrade() -> None:
    if has_table("payment_orders"):
        op.drop_table("payment_orders")
    if has_table("ai_usages"):
        op.drop_table("ai_usages")
    if has_table("ai_wallets"):
        op.drop_table("ai_wallets")
