"""Mode révision élève — réponses temporaires et note de pratique.

Revision ID: 015
Revises: 014
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

from app.migration_utils import has_column, has_table

revision: str = "015"
down_revision: Union[str, None] = "014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not has_column("student_exam_attempts", "practice_active"):
        op.add_column(
            "student_exam_attempts",
            sa.Column("practice_active", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
    if not has_column("student_exam_attempts", "practice_score"):
        op.add_column("student_exam_attempts", sa.Column("practice_score", sa.Float(), nullable=True))
    if not has_column("student_exam_attempts", "practice_max_score"):
        op.add_column(
            "student_exam_attempts", sa.Column("practice_max_score", sa.Float(), nullable=True)
        )
    if not has_column("student_exam_attempts", "practice_submitted_at"):
        op.add_column(
            "student_exam_attempts",
            sa.Column("practice_submitted_at", sa.DateTime(timezone=True), nullable=True),
        )

    if not has_table("practice_answers"):
        op.create_table(
            "practice_answers",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("attempt_id", sa.Integer(), sa.ForeignKey("student_exam_attempts.id"), nullable=False),
            sa.Column("question_id", sa.Integer(), sa.ForeignKey("questions.id"), nullable=False),
            sa.Column("selected_option_ids", JSONB, nullable=False, server_default="[]"),
        )
        op.create_index("ix_practice_answers_attempt_id", "practice_answers", ["attempt_id"])

    if not has_column("question_ai_explanations", "for_practice"):
        op.add_column(
            "question_ai_explanations",
            sa.Column("for_practice", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
        op.drop_constraint(
            "uq_question_ai_explanations_attempt_question_lang",
            "question_ai_explanations",
            type_="unique",
        )
        op.create_unique_constraint(
            "uq_question_ai_explanations_attempt_question_lang_practice",
            "question_ai_explanations",
            ["attempt_id", "question_id", "language", "for_practice"],
        )


def downgrade() -> None:
    if has_column("question_ai_explanations", "for_practice"):
        op.drop_constraint(
            "uq_question_ai_explanations_attempt_question_lang_practice",
            "question_ai_explanations",
            type_="unique",
        )
        op.create_unique_constraint(
            "uq_question_ai_explanations_attempt_question_lang",
            "question_ai_explanations",
            ["attempt_id", "question_id", "language"],
        )
        op.drop_column("question_ai_explanations", "for_practice")

    if has_table("practice_answers"):
        op.drop_index("ix_practice_answers_attempt_id", table_name="practice_answers")
        op.drop_table("practice_answers")

    for col in ("practice_submitted_at", "practice_max_score", "practice_score", "practice_active"):
        if has_column("student_exam_attempts", col):
            op.drop_column("student_exam_attempts", col)
