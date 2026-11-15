"""Tuteur IA côté élève : une conversation par tentative, question et mode (examen / révision)."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TutorConversation(Base):
    __tablename__ = "ai_tutor_conversations"
    __table_args__ = (
        UniqueConstraint(
            "attempt_id",
            "question_id",
            "for_practice",
            name="uq_ai_tutor_attempt_question_practice",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[int] = mapped_column(
        ForeignKey("student_exam_attempts.id", ondelete="CASCADE"), index=True
    )
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), index=True)
    for_practice: Mapped[bool] = mapped_column(Boolean, default=False)
    # Vrai dès que le crédit élève de cette conversation a été débité (un crédit par question).
    charged: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    messages = relationship(
        "TutorMessage",
        back_populates="conversation",
        order_by="TutorMessage.id",
        cascade="all, delete-orphan",
    )


class TutorMessage(Base):
    __tablename__ = "ai_tutor_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("ai_tutor_conversations.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[str] = mapped_column(String(10))  # "user" | "model"
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("TutorConversation", back_populates="messages")
