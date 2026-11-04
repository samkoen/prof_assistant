"""Liens Moodle : connexion professeur, cours, élèves, devoir.

Revision ID: 034
Revises: 033
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from app.migration_utils import has_table

revision: str = "034"
down_revision: str | None = "033"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    _connections()
    _course_links()
    _user_links()
    _grade_links()


def downgrade() -> None:
    for name in (
        "moodle_grade_links",
        "moodle_user_links",
        "moodle_course_links",
        "moodle_connections",
    ):
        if has_table(name):
            op.drop_table(name)


def _connections() -> None:
    if has_table("moodle_connections"):
        return
    op.create_table(
        "moodle_connections",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("teacher_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("base_url", sa.String(512), nullable=False),
        sa.Column("token_encrypted", sa.Text(), nullable=False),
        sa.Column("moodle_user_id", sa.Integer(), nullable=False),
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
        sa.UniqueConstraint("teacher_id", name="uq_moodle_connection_teacher"),
    )
    op.create_index("ix_moodle_connections_teacher_id", "moodle_connections", ["teacher_id"])


def _course_links() -> None:
    if has_table("moodle_course_links"):
        return
    op.create_table(
        "moodle_course_links",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "offering_id", sa.Integer(), sa.ForeignKey("course_offerings.id"), nullable=False
        ),
        sa.Column("moodle_course_id", sa.Integer(), nullable=False),
        sa.UniqueConstraint("offering_id", name="uq_moodle_course_offering"),
    )
    op.create_index("ix_moodle_course_links_offering_id", "moodle_course_links", ["offering_id"])
    op.create_index(
        "ix_moodle_course_links_moodle_course_id", "moodle_course_links", ["moodle_course_id"]
    )


def _user_links() -> None:
    if has_table("moodle_user_links"):
        return
    op.create_table(
        "moodle_user_links",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("teacher_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("moodle_user_id", sa.Integer(), nullable=False),
        sa.UniqueConstraint("teacher_id", "user_id", name="uq_moodle_user_teacher_user"),
        sa.UniqueConstraint("teacher_id", "moodle_user_id", name="uq_moodle_user_teacher_moodle"),
    )
    op.create_index("ix_moodle_user_links_teacher_id", "moodle_user_links", ["teacher_id"])
    op.create_index("ix_moodle_user_links_user_id", "moodle_user_links", ["user_id"])
    op.create_index("ix_moodle_user_links_moodle_user_id", "moodle_user_links", ["moodle_user_id"])


def _grade_links() -> None:
    if has_table("moodle_grade_links"):
        return
    op.create_table(
        "moodle_grade_links",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "exam_session_id", sa.Integer(), sa.ForeignKey("exam_sessions.id"), nullable=False
        ),
        sa.Column("moodle_assign_id", sa.Integer(), nullable=False),
        sa.UniqueConstraint("exam_session_id", name="uq_moodle_grade_session"),
    )
    op.create_index(
        "ix_moodle_grade_links_exam_session_id", "moodle_grade_links", ["exam_session_id"]
    )
