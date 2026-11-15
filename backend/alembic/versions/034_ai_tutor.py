"""Tuteur IA élève : réglage par מטלה, notes IA par question, historique des conversations.

Revision ID: 034
Revises: 033
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column, has_table

revision: str = "034"
down_revision: Union[str, None] = "033"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _add_columns() -> None:
    if not has_column("exams", "ai_tutor_enabled"):
        op.add_column(
            "exams",
            sa.Column("ai_tutor_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        )
    if not has_column("questions", "ai_notes"):
        op.add_column("questions", sa.Column("ai_notes", sa.Text(), nullable=True))


def _create_conversations() -> None:
    op.create_table(
        "ai_tutor_conversations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "attempt_id",
            sa.Integer(),
            sa.ForeignKey("student_exam_attempts.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "question_id",
            sa.Integer(),
            sa.ForeignKey("questions.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("for_practice", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("charged", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint(
            "attempt_id", "question_id", "for_practice", name="uq_ai_tutor_attempt_question_practice"
        ),
    )


def _create_messages() -> None:
    op.create_table(
        "ai_tutor_messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "conversation_id",
            sa.Integer(),
            sa.ForeignKey("ai_tutor_conversations.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("role", sa.String(length=10), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def upgrade() -> None:
    _add_columns()
    if not has_table("ai_tutor_conversations"):
        _create_conversations()
    if not has_table("ai_tutor_messages"):
        _create_messages()


def downgrade() -> None:
    if has_table("ai_tutor_messages"):
        op.drop_table("ai_tutor_messages")
    if has_table("ai_tutor_conversations"):
        op.drop_table("ai_tutor_conversations")
    if has_column("questions", "ai_notes"):
        op.drop_column("questions", "ai_notes")
    if has_column("exams", "ai_tutor_enabled"):
        op.drop_column("exams", "ai_tutor_enabled")
