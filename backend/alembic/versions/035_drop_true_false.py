"""Suppression du type de question vrai/faux : les questions existantes passent en choix unique.

Revision ID: 035
Revises: 034
"""
from typing import Sequence, Union

from alembic import op

revision: str = "035"
down_revision: Union[str, None] = "034"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE questions SET question_type = 'single' WHERE question_type = 'true_false'")


def downgrade() -> None:
    # Irréversible : on ne sait plus quelles questions étaient en vrai/faux.
    pass
