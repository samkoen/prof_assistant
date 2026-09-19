"""Co-enseignants sur une הרצה : membres + invitations.

Revision ID: 021
Revises: 020
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_table

revision: str = "021"
down_revision: Union[str, None] = "020"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not has_table("offering_teachers"):
        op.create_table(
            "offering_teachers",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "offering_id",
                sa.Integer(),
                sa.ForeignKey("course_offerings.id"),
                nullable=False,
                index=True,
            ),
            sa.Column(
                "teacher_id",
                sa.Integer(),
                sa.ForeignKey("users.id"),
                nullable=False,
                index=True,
            ),
            sa.Column("role", sa.String(20), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.UniqueConstraint("offering_id", "teacher_id", name="uq_offering_teacher"),
        )
    if not has_table("offering_teacher_invites"):
        op.create_table(
            "offering_teacher_invites",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "offering_id",
                sa.Integer(),
                sa.ForeignKey("course_offerings.id"),
                nullable=False,
                index=True,
            ),
            sa.Column(
                "inviter_id",
                sa.Integer(),
                sa.ForeignKey("users.id"),
                nullable=False,
                index=True,
            ),
            sa.Column(
                "recipient_id",
                sa.Integer(),
                sa.ForeignKey("users.id"),
                nullable=False,
                index=True,
            ),
            sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
            sa.Column("message", sa.Text(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
            sa.UniqueConstraint(
                "offering_id", "recipient_id", name="uq_offering_teacher_invite_pair"
            ),
        )
    _backfill_owners()


def _backfill_owners() -> None:
    op.execute(
        """
        INSERT INTO offering_teachers (offering_id, teacher_id, role)
        SELECT id, teacher_id, 'owner'
        FROM course_offerings
        WHERE NOT EXISTS (
            SELECT 1 FROM offering_teachers ot
            WHERE ot.offering_id = course_offerings.id
              AND ot.teacher_id = course_offerings.teacher_id
        )
        """
    )


def downgrade() -> None:
    if has_table("offering_teacher_invites"):
        op.drop_table("offering_teacher_invites")
    if has_table("offering_teachers"):
        op.drop_table("offering_teachers")
