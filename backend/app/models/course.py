from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import EnrollmentStatus


class CourseCatalog(Base):
    """Cours catalogue — contenu pédagogique réutilisable (sans prof, élèves, année)."""

    __tablename__ = "course_catalogs"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", back_populates="catalog_courses_created")
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
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    catalog_course_id: Mapped[int] = mapped_column(ForeignKey("course_catalogs.id"), index=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    group_name: Mapped[str] = mapped_column(String(255))
    academic_year: Mapped[int] = mapped_column(Integer, index=True)
    semester: Mapped[int] = mapped_column(Integer, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_open_enrollment: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    catalog_course = relationship("CourseCatalog", back_populates="offerings")
    teacher = relationship("User", back_populates="offerings_teaching")
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
