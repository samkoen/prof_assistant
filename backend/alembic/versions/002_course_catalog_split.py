"""Séparation cours catalogue / instance de cours.

Revision ID: 002
Revises: 001
Create Date: 2026-05-24

ATTENTION: migration destructive — supprime les anciennes tables courses/subjects/school_classes
et recrée le schéma catalogue + offerings. Réexécutez seed_admin après upgrade si base vide.
"""
from typing import Sequence, Union

from alembic import op

from app.database import Base
from app.models import *  # noqa: F401, F403

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_OLD_TABLES = [
    "answers",
    "student_exam_attempts",
    "question_options",
    "questions",
    "exams",
    "notifications",
    "course_enrollments",
    "courses",
    "school_classes",
    "subjects",
]


def upgrade() -> None:
    bind = op.get_bind()
    for table in _OLD_TABLES:
        op.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE')
    Base.metadata.create_all(bind, checkfirst=True)


def downgrade() -> None:
    bind = op.get_bind()
    for table in reversed(_OLD_TABLES):
        op.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE')
    Base.metadata.create_all(bind, checkfirst=True)
