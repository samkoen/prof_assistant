from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MoodleConnection(Base):
    """Jeton Moodle d'un professeur. Le secret est chiffré, jamais renvoyé."""

    __tablename__ = "moodle_connections"
    __table_args__ = (UniqueConstraint("teacher_id", name="uq_moodle_connection_teacher"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    base_url: Mapped[str] = mapped_column(String(512))
    token_encrypted: Mapped[str] = mapped_column(Text)
    moodle_user_id: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MoodleCourseLink(Base):
    """Cours local relié à un cours Moodle."""

    __tablename__ = "moodle_course_links"
    __table_args__ = (UniqueConstraint("offering_id", name="uq_moodle_course_offering"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    offering_id: Mapped[int] = mapped_column(ForeignKey("course_offerings.id"), index=True)
    moodle_course_id: Mapped[int] = mapped_column(Integer, index=True)


class MoodleUserLink(Base):
    """Élève local relié à un utilisateur Moodle, pour un professeur."""

    __tablename__ = "moodle_user_links"
    __table_args__ = (
        UniqueConstraint("teacher_id", "user_id", name="uq_moodle_user_teacher_user"),
        UniqueConstraint("teacher_id", "moodle_user_id", name="uq_moodle_user_teacher_moodle"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    moodle_user_id: Mapped[int] = mapped_column(Integer, index=True)


class MoodleGradeLink(Base):
    """Devoir Moodle qui reçoit les notes d'une session d'examen."""

    __tablename__ = "moodle_grade_links"
    __table_args__ = (UniqueConstraint("exam_session_id", name="uq_moodle_grade_session"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    exam_session_id: Mapped[int] = mapped_column(ForeignKey("exam_sessions.id"), index=True)
    moodle_assign_id: Mapped[int] = mapped_column(Integer)
