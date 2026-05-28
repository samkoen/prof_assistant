"""cache ai explanations per attempt/question/language

Revision ID: 008
Revises: 007
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_table

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if has_table("question_ai_explanations"):
        return
    op.create_table(
        "question_ai_explanations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("attempt_id", sa.Integer(), sa.ForeignKey("student_exam_attempts.id"), nullable=False),
        sa.Column("question_id", sa.Integer(), sa.ForeignKey("questions.id"), nullable=False),
        sa.Column("language", sa.String(length=2), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint(
            "attempt_id",
            "question_id",
            "language",
            name="uq_question_ai_explanations_attempt_question_lang",
        ),
    )
    op.create_index("ix_question_ai_explanations_attempt_id", "question_ai_explanations", ["attempt_id"])
    op.create_index("ix_question_ai_explanations_question_id", "question_ai_explanations", ["question_id"])
    op.create_index("ix_question_ai_explanations_language", "question_ai_explanations", ["language"])


def downgrade() -> None:
    if not has_table("question_ai_explanations"):
        return
    op.drop_index("ix_question_ai_explanations_language", table_name="question_ai_explanations")
    op.drop_index("ix_question_ai_explanations_question_id", table_name="question_ai_explanations")
    op.drop_index("ix_question_ai_explanations_attempt_id", table_name="question_ai_explanations")
    op.drop_table("question_ai_explanations")
