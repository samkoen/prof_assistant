"""Schéma initial — tables du projet

Revision ID: 001
Revises:
Create Date: 2026-05-20

"""
from typing import Sequence, Union

from alembic import op

from app.database import Base
from app.models import *  # noqa: F401, F403

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind, checkfirst=True)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind)
