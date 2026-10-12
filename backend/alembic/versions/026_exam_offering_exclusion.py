"""Un examen catalogue peut être retiré d'un seul groupe.

Revision ID: 026
Revises: 025
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_table

revision: str = "026"
down_revision: Union[str, None] = "025"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if has_table("exam_offering_exclusions"):
        return
    op.create_table(
        "exam_offering_exclusions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("exam_id", sa.Integer(), sa.ForeignKey("exams.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "offering_id",
            sa.Integer(),
            sa.ForeignKey("course_offerings.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.UniqueConstraint("exam_id", "offering_id", name="uq_exam_offering_exclusion"),
    )
    op.create_index("ix_exam_offering_exclusions_exam_id", "exam_offering_exclusions", ["exam_id"])
    op.create_index("ix_exam_offering_exclusions_offering_id", "exam_offering_exclusions", ["offering_id"])


def downgrade() -> None:
    if has_table("exam_offering_exclusions"):
        op.drop_table("exam_offering_exclusions")
