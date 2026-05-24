from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import ExamStatus, MultipleScoringMode, QuestionType


class Exam(Base):
    """Modèle d'examen rattaché au cours catalogue."""

    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(primary_key=True)
    catalog_course_id: Mapped[int] = mapped_column(ForeignKey("course_catalogs.id"), index=True)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    scope_teacher_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    scope_academic_year: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    scope_semester: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    scope_group_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=45)
    shuffle_questions: Mapped[bool] = mapped_column(Boolean, nullable=False)
    shuffle_options: Mapped[bool] = mapped_column(Boolean, nullable=False)
    show_detailed_correction: Mapped[bool] = mapped_column(Boolean, default=True)
    warning_minutes: Mapped[int] = mapped_column(Integer, default=10)
    auto_submit_on_timeout: Mapped[bool] = mapped_column(Boolean, default=True)
    default_multiple_scoring: Mapped[MultipleScoringMode] = mapped_column(
        String(30), default=MultipleScoringMode.PROPORTIONAL
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    catalog_course = relationship("CourseCatalog", back_populates="exams")
    creator = relationship("User", foreign_keys=[created_by_id])
    scope_teacher = relationship("User", foreign_keys=[scope_teacher_id])
    questions = relationship("Question", back_populates="exam", order_by="Question.order_index")
    sessions = relationship("ExamSession", back_populates="exam")


class ExamSession(Base):
    """Activation d'un examen pour une instance de cours (groupe / semestre)."""

    __tablename__ = "exam_sessions"
    __table_args__ = (UniqueConstraint("exam_id", "offering_id", name="uq_exam_offering"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id"), index=True)
    offering_id: Mapped[int] = mapped_column(ForeignKey("course_offerings.id"), index=True)
    status: Mapped[ExamStatus] = mapped_column(
        String(20), default=ExamStatus.DRAFT, insert_default=ExamStatus.DRAFT, index=True
    )
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    results_published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    exam = relationship("Exam", back_populates="sessions")
    offering = relationship("CourseOffering", back_populates="exam_sessions")
    attempts = relationship("StudentExamAttempt", back_populates="exam_session")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id"), index=True)
    text: Mapped[str] = mapped_column(Text)
    question_type: Mapped[QuestionType] = mapped_column(String(20))
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    points: Mapped[float] = mapped_column(Float, default=1.0)
    multiple_scoring_mode: Mapped[MultipleScoringMode | None] = mapped_column(String(30), nullable=True)

    exam = relationship("Exam", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", order_by="QuestionOption.order_index")


class QuestionOption(Base):
    __tablename__ = "question_options"

    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"), index=True)
    text: Mapped[str] = mapped_column(Text)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    question = relationship("Question", back_populates="options")


class StudentExamAttempt(Base):
    __tablename__ = "student_exam_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    exam_session_id: Mapped[int] = mapped_column(ForeignKey("exam_sessions.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    progress_index: Mapped[int] = mapped_column(Integer, default=0)
    session_token: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    can_resubmit: Mapped[bool] = mapped_column(Boolean, default=False)
    warning_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    exam_session = relationship("ExamSession", back_populates="attempts")
    answers = relationship("Answer", back_populates="attempt")


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("student_exam_attempts.id"), index=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"))
    selected_option_ids: Mapped[list] = mapped_column(JSONB, default=list)

    attempt = relationship("StudentExamAttempt", back_populates="answers")
