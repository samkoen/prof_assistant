"""exam gemini generation sessions and messages

Revision ID: 009
Revises: 008
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from app.migration_utils import has_table

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not has_table("exam_gemini_generation_sessions"):
        op.create_table(
            "exam_gemini_generation_sessions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("exam_id", sa.Integer(), sa.ForeignKey("exams.id"), nullable=False),
            sa.Column("teacher_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("status", sa.String(20), nullable=False, server_default="active"),
            sa.Column("initial_params", postgresql.JSONB(), nullable=False, server_default="{}"),
            sa.Column("last_raw_text", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )
        op.create_index(
            "ix_exam_gemini_sessions_exam_teacher",
            "exam_gemini_generation_sessions",
            ["exam_id", "teacher_id"],
        )
    if not has_table("exam_gemini_generation_messages"):
        op.create_table(
            "exam_gemini_generation_messages",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "session_id",
                sa.Integer(),
                sa.ForeignKey("exam_gemini_generation_sessions.id"),
                nullable=False,
            ),
            sa.Column("role", sa.String(10), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )
        op.create_index(
            "ix_exam_gemini_messages_session_id",
            "exam_gemini_generation_messages",
            ["session_id"],
        )


def downgrade() -> None:
    op.drop_index("ix_exam_gemini_messages_session_id", table_name="exam_gemini_generation_messages")
    op.drop_table("exam_gemini_generation_messages")
    op.drop_index("ix_exam_gemini_sessions_exam_teacher", table_name="exam_gemini_generation_sessions")
    op.drop_table("exam_gemini_generation_sessions")
