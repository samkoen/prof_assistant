"""auto_approve_enrollment sur course_offerings.

Revision ID: 004
Revises: 003
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if has_column("course_offerings", "auto_approve_enrollment"):
        return
    op.add_column(
        "course_offerings",
        sa.Column("auto_approve_enrollment", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("course_offerings", "auto_approve_enrollment")
