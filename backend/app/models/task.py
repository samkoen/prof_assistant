from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, LargeBinary, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, deferred, mapped_column

from app.database import Base


class TaskStep(Base):
    """Sous-tâche d'une משימה : consigne et barème, sans question."""

    __tablename__ = "task_steps"

    id: Mapped[int] = mapped_column(primary_key=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id"), index=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    title: Mapped[str] = mapped_column(String(255))
    instructions: Mapped[str] = mapped_column(Text)
    max_points: Mapped[float] = mapped_column(Float, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TaskProof(Base):
    """Preuve déposée par l'élève (capture, image ou fichier), octets en base."""

    __tablename__ = "task_proofs"
    __table_args__ = (UniqueConstraint("attempt_id", "step_id", name="uq_task_proof_attempt_step"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("student_exam_attempts.id"), index=True)
    step_id: Mapped[int] = mapped_column(ForeignKey("task_steps.id"), index=True)
    filename: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(127))
    file_data: Mapped[bytes] = deferred(mapped_column(LargeBinary))
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TaskReview(Base):
    """Avis sur une sous-tâche : automatique, IA, ou corrigé par le professeur."""

    __tablename__ = "task_reviews"
    __table_args__ = (UniqueConstraint("attempt_id", "step_id", name="uq_task_review_attempt_step"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("student_exam_attempts.id"), index=True)
    step_id: Mapped[int] = mapped_column(ForeignKey("task_steps.id"), index=True)
    verdict: Mapped[str] = mapped_column(String(20))
    ai_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    score: Mapped[float] = mapped_column(Float, default=0)
    appreciation: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(20))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
