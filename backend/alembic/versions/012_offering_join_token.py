"""join_token + join_token_expires_at sur course_offerings.

Revision ID: 012
Revises: 011
"""
from datetime import datetime, timedelta, timezone
import secrets
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.migration_utils import has_column

revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not has_column("course_offerings", "join_token"):
        op.add_column("course_offerings", sa.Column("join_token", sa.String(64), nullable=True))
    if not has_column("course_offerings", "join_token_expires_at"):
        op.add_column(
            "course_offerings",
            sa.Column("join_token_expires_at", sa.DateTime(timezone=True), nullable=True),
        )

    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id FROM course_offerings WHERE join_token IS NULL")).fetchall()
    expires = datetime.now(timezone.utc) + timedelta(days=30)
    for (offering_id,) in rows:
        token = secrets.token_urlsafe(24)
        conn.execute(
            sa.text(
                "UPDATE course_offerings SET join_token = :token, join_token_expires_at = :expires WHERE id = :id"
            ),
            {"token": token, "expires": expires, "id": offering_id},
        )

    op.alter_column("course_offerings", "join_token", nullable=False)
    op.create_index("ix_course_offerings_join_token", "course_offerings", ["join_token"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_course_offerings_join_token", table_name="course_offerings")
    op.drop_column("course_offerings", "join_token_expires_at")
    op.drop_column("course_offerings", "join_token")
