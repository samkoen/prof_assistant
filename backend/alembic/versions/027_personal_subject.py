"""Matière personnelle d'un élève : propriétaire sans professeur.

Revision ID: 027
Revises: 026
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column

revision: str = "027"
down_revision: Union[str, None] = "026"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_ONE_OWNER = (
    "(teacher_id IS NOT NULL AND owner_student_id IS NULL) OR "
    "(teacher_id IS NULL AND owner_student_id IS NOT NULL)"
)


def upgrade() -> None:
    if has_column("course_catalogs", "owner_student_id"):
        return
    op.add_column("course_catalogs", sa.Column("owner_student_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_course_catalogs_owner_student_id", "course_catalogs", "users", ["owner_student_id"], ["id"]
    )
    op.create_index("ix_course_catalogs_owner_student_id", "course_catalogs", ["owner_student_id"])
    op.create_unique_constraint("uq_catalog_student_name", "course_catalogs", ["owner_student_id", "name"])
    op.alter_column("course_catalogs", "teacher_id", existing_type=sa.Integer(), nullable=True)
    op.alter_column("course_offerings", "teacher_id", existing_type=sa.Integer(), nullable=True)
    op.create_check_constraint("ck_catalog_one_owner", "course_catalogs", _ONE_OWNER)
    op.create_index(
        "uq_personal_offering_catalog",
        "course_offerings",
        ["catalog_course_id"],
        unique=True,
        sqlite_where=sa.text("teacher_id IS NULL"),
        postgresql_where=sa.text("teacher_id IS NULL"),
    )


def downgrade() -> None:
    if not has_column("course_catalogs", "owner_student_id"):
        return
    op.drop_index("uq_personal_offering_catalog", table_name="course_offerings")
    op.drop_constraint("ck_catalog_one_owner", "course_catalogs", type_="check")
    op.alter_column("course_offerings", "teacher_id", existing_type=sa.Integer(), nullable=False)
    op.alter_column("course_catalogs", "teacher_id", existing_type=sa.Integer(), nullable=False)
    op.drop_constraint("uq_catalog_student_name", "course_catalogs", type_="unique")
    op.drop_index("ix_course_catalogs_owner_student_id", table_name="course_catalogs")
    op.drop_constraint("fk_course_catalogs_owner_student_id", "course_catalogs", type_="foreignkey")
    op.drop_column("course_catalogs", "owner_student_id")
