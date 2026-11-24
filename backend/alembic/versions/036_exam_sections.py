"""Parties d'examen (consigne, « répondre à N questions ») et plafond de note.

Revision ID: 036
Revises: 035
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column, has_table

revision: str = "036"
down_revision: Union[str, None] = "035"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not has_table("exam_sections"):
        op.create_table(
            "exam_sections",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("exam_id", sa.Integer(), sa.ForeignKey("exams.id"), nullable=False, index=True),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("instructions", sa.Text(), nullable=True),
            sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("required_count", sa.Integer(), nullable=True),
        )
    if not has_column("questions", "section_id"):
        op.add_column(
            "questions",
            sa.Column("section_id", sa.Integer(), sa.ForeignKey("exam_sections.id"), nullable=True),
        )
        op.create_index("ix_questions_section_id", "questions", ["section_id"])
    if not has_column("exams", "score_cap"):
        op.add_column("exams", sa.Column("score_cap", sa.Float(), nullable=True))


def downgrade() -> None:
    if has_column("exams", "score_cap"):
        op.drop_column("exams", "score_cap")
    if has_column("questions", "section_id"):
        op.drop_index("ix_questions_section_id", table_name="questions")
        op.drop_column("questions", "section_id")
    if has_table("exam_sections"):
        op.drop_table("exam_sections")
