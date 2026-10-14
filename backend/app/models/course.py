from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import EnrollmentStatus


class CourseCatalog(Base):
    """Cours catalogue — contenu pédagogique d'un prof (matière), réutilisable entre הרצות."""

    __tablename__ = "course_catalogs"
    __table_args__ = (
        UniqueConstraint("teacher_id", "name", name="uq_catalog_teacher_name"),
        UniqueConstraint("owner_student_id", "name", name="uq_catalog_student_name"),
        CheckConstraint(
            "(teacher_id IS NOT NULL AND owner_student_id IS NULL) OR "
            "(teacher_id IS NULL AND owner_student_id IS NOT NULL)",
            name="ck_catalog_one_owner",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    teacher_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    owner_student_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    teacher = relationship(
        "User", foreign_keys=[teacher_id], back_populates="catalog_courses"
    )
    owner_student = relationship(
        "User", foreign_keys=[owner_student_id], back_populates="owned_catalogs"
    )
    offerings = relationship("CourseOffering", back_populates="catalog_course")
    exams = relationship("Exam", back_populates="catalog_course")
    exercises = relationship("Exercise", back_populates="catalog_course")


class CourseOffering(Base):
    """Instance de cours — prof + année + semestre + groupe."""

    __tablename__ = "course_offerings"
    __table_args__ = (
        UniqueConstraint(
            "catalog_course_id",
            "teacher_id",
            "academic_year",
            "semester",
            "group_name",
            name="uq_offering_session",
        ),
        Index(
            "uq_personal_offering_catalog",
            "catalog_course_id",
            unique=True,
            sqlite_where=text("teacher_id IS NULL"),
            postgresql_where=text("teacher_id IS NULL"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    catalog_course_id: Mapped[int] = mapped_column(ForeignKey("course_catalogs.id"), index=True)
    teacher_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    group_name: Mapped[str] = mapped_column(String(255))
    academic_year: Mapped[int] = mapped_column(Integer, index=True)
    semester: Mapped[int] = mapped_column(Integer, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_open_enrollment: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_approve_enrollment: Mapped[bool] = mapped_column(Boolean, default=False)
    join_token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    join_token_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    catalog_course = relationship("CourseCatalog", back_populates="offerings")
    teacher = relationship("User", back_populates="offerings_teaching")
    teacher_members = relationship(
        "OfferingTeacher", back_populates="offering", cascade="all, delete-orphan"
    )
    enrollments = relationship("CourseEnrollment", back_populates="offering")
    exam_sessions = relationship("ExamSession", back_populates="offering")


class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"
    __table_args__ = (UniqueConstraint("offering_id", "student_id", name="uq_offering_student"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    offering_id: Mapped[int] = mapped_column(ForeignKey("course_offerings.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[EnrollmentStatus] = mapped_column(String(20), default=EnrollmentStatus.PENDING)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    offering = relationship("CourseOffering", back_populates="enrollments")
    student = relationship("User", back_populates="enrollments")
