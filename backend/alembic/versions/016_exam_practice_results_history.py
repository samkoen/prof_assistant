"""Historique des notes de תרגול par élève.

Revision ID: 016
Revises: 015
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_table

revision: str = "016"
down_revision: Union[str, None] = "015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not has_table("exam_practice_results"):
        op.create_table(
            "exam_practice_results",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "attempt_id",
                sa.Integer(),
                sa.ForeignKey("student_exam_attempts.id"),
                nullable=False,
            ),
            sa.Column("score", sa.Float(), nullable=False),
            sa.Column("max_score", sa.Float(), nullable=False),
            sa.Column(
                "submitted_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
        )
        op.create_index(
            "ix_exam_practice_results_attempt_id",
            "exam_practice_results",
            ["attempt_id"],
        )
        op.execute(
            """
            INSERT INTO exam_practice_results (attempt_id, score, max_score, submitted_at)
            SELECT id, practice_score, practice_max_score, practice_submitted_at
            FROM student_exam_attempts
            WHERE practice_submitted_at IS NOT NULL
              AND practice_score IS NOT NULL
              AND practice_max_score IS NOT NULL
            """
        )


def downgrade() -> None:
    if has_table("exam_practice_results"):
        op.drop_index("ix_exam_practice_results_attempt_id", table_name="exam_practice_results")
        op.drop_table("exam_practice_results")
