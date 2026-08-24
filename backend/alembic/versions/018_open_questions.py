"""Questions ouvertes : bonne réponse partagée + appréciation par élève.

Revision ID: 018
Revises: 017
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column, has_table

revision: str = "018"
down_revision: Union[str, None] = "017"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _add_text_columns() -> None:
    if not has_column("questions", "model_answer"):
        op.add_column("questions", sa.Column("model_answer", sa.Text(), nullable=True))
    if not has_column("questions", "model_answer_source"):
        op.add_column(
            "questions",
            sa.Column("model_answer_source", sa.String(length=20), nullable=True),
        )
    if not has_column("answers", "text_answer"):
        op.add_column("answers", sa.Column("text_answer", sa.Text(), nullable=True))
    if not has_column("practice_answers", "text_answer"):
        op.add_column("practice_answers", sa.Column("text_answer", sa.Text(), nullable=True))


def _create_evaluations_table() -> None:
    if has_table("open_answer_evaluations"):
        return
    op.create_table(
        "open_answer_evaluations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "attempt_id",
            sa.Integer(),
            sa.ForeignKey("student_exam_attempts.id"),
            nullable=False,
        ),
        sa.Column("question_id", sa.Integer(), sa.ForeignKey("questions.id"), nullable=False),
        sa.Column("for_practice", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("language", sa.String(length=2), nullable=False),
        sa.Column("appreciation", sa.Text(), nullable=False),
        sa.Column("suggested_score", sa.Float(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "attempt_id",
            "question_id",
            "for_practice",
            name="uq_open_eval_attempt_question_practice",
        ),
    )
    op.create_index(
        "ix_open_answer_evaluations_attempt_id",
        "open_answer_evaluations",
        ["attempt_id"],
    )
    op.create_index(
        "ix_open_answer_evaluations_question_id",
        "open_answer_evaluations",
        ["question_id"],
    )


def upgrade() -> None:
    _add_text_columns()
    _create_evaluations_table()


def downgrade() -> None:
    if has_table("open_answer_evaluations"):
        op.drop_index("ix_open_answer_evaluations_question_id", table_name="open_answer_evaluations")
        op.drop_index("ix_open_answer_evaluations_attempt_id", table_name="open_answer_evaluations")
        op.drop_table("open_answer_evaluations")
    if has_column("practice_answers", "text_answer"):
        op.drop_column("practice_answers", "text_answer")
    if has_column("answers", "text_answer"):
        op.drop_column("answers", "text_answer")
    if has_column("questions", "model_answer_source"):
        op.drop_column("questions", "model_answer_source")
    if has_column("questions", "model_answer"):
        op.drop_column("questions", "model_answer")
