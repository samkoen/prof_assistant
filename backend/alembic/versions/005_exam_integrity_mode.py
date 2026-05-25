"""Mode intégrité examen + événements de focus.

Revision ID: 005
Revises: 004
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "exam_sessions",
        sa.Column("integrity_mode_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "student_exam_attempts",
        sa.Column("rules_accepted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "student_exam_attempts",
        sa.Column("focus_loss_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "student_exam_attempts",
        sa.Column("total_hidden_seconds", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_table(
        "attempt_integrity_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("attempt_id", sa.Integer(), sa.ForeignKey("student_exam_attempts.id"), nullable=False),
        sa.Column("event_type", sa.String(32), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
    )
    op.create_index("ix_attempt_integrity_events_attempt_id", "attempt_integrity_events", ["attempt_id"])


def downgrade() -> None:
    op.drop_index("ix_attempt_integrity_events_attempt_id", table_name="attempt_integrity_events")
    op.drop_table("attempt_integrity_events")
    op.drop_column("student_exam_attempts", "total_hidden_seconds")
    op.drop_column("student_exam_attempts", "focus_loss_count")
    op.drop_column("student_exam_attempts", "rules_accepted_at")
    op.drop_column("exam_sessions", "integrity_mode_enabled")
