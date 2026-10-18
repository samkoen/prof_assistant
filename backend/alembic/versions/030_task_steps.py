"""Type משימה : kind, sous-tâches, preuves et avis.

Revision ID: 030
Revises: 029
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column, has_table

revision: str = "030"
down_revision: Union[str, None] = "029"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not has_column("exams", "kind"):
        op.add_column("exams", sa.Column("kind", sa.String(length=20), nullable=False, server_default="official"))
        op.execute("UPDATE exams SET kind = 'tirgoul' WHERE is_tirgoul IS TRUE")
    if has_table("task_steps"):
        return
    op.create_table(
        "task_steps",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("exam_id", sa.Integer(), sa.ForeignKey("exams.id"), nullable=False, index=True),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("instructions", sa.Text(), nullable=False),
        sa.Column("max_points", sa.Float(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "task_proofs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("attempt_id", sa.Integer(), sa.ForeignKey("student_exam_attempts.id"), nullable=False, index=True),
        sa.Column("step_id", sa.Integer(), sa.ForeignKey("task_steps.id"), nullable=False, index=True),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=127), nullable=False),
        sa.Column("file_data", sa.LargeBinary(), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("attempt_id", "step_id", name="uq_task_proof_attempt_step"),
    )
    op.create_table(
        "task_reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("attempt_id", sa.Integer(), sa.ForeignKey("student_exam_attempts.id"), nullable=False, index=True),
        sa.Column("step_id", sa.Integer(), sa.ForeignKey("task_steps.id"), nullable=False, index=True),
        sa.Column("verdict", sa.String(length=20), nullable=False),
        sa.Column("ai_score", sa.Float(), nullable=True),
        sa.Column("score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("appreciation", sa.Text(), nullable=True),
        sa.Column("source", sa.String(length=20), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("attempt_id", "step_id", name="uq_task_review_attempt_step"),
    )


def downgrade() -> None:
    if has_table("task_reviews"):
        op.drop_table("task_reviews")
    if has_table("task_proofs"):
        op.drop_table("task_proofs")
    if has_table("task_steps"):
        op.drop_table("task_steps")
    if has_column("exams", "kind"):
        op.drop_column("exams", "kind")
