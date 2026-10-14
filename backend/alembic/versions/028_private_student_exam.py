"""Matala privée d'un élève sur un cours de classe.

Revision ID: 028
Revises: 027
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column

revision: str = "028"
down_revision: Union[str, None] = "027"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if has_column("exams", "private_student_id"):
        return
    op.add_column("exams", sa.Column("private_student_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_exams_private_student_id", "exams", "users", ["private_student_id"], ["id"]
    )
    op.create_index("ix_exams_private_student_id", "exams", ["private_student_id"])


def downgrade() -> None:
    if not has_column("exams", "private_student_id"):
        return
    op.drop_index("ix_exams_private_student_id", table_name="exams")
    op.drop_constraint("fk_exams_private_student_id", "exams", type_="foreignkey")
    op.drop_column("exams", "private_student_id")
