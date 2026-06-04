"""course_catalogs: created_by_id → teacher_id, unicité (teacher_id, name).

Revision ID: 013
Revises: 012
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column

revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if has_column("course_catalogs", "teacher_id"):
        return
    if has_column("course_catalogs", "created_by_id"):
        op.alter_column("course_catalogs", "created_by_id", new_column_name="teacher_id")
    else:
        op.add_column("course_catalogs", sa.Column("teacher_id", sa.Integer(), nullable=True))
        op.execute(sa.text("UPDATE course_catalogs SET teacher_id = 1 WHERE teacher_id IS NULL"))
        op.alter_column("course_catalogs", "teacher_id", nullable=False)

    op.create_unique_constraint(
        "uq_catalog_teacher_name",
        "course_catalogs",
        ["teacher_id", "name"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_catalog_teacher_name", "course_catalogs", type_="unique")
    op.alter_column("course_catalogs", "teacher_id", new_column_name="created_by_id")
