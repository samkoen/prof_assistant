from datetime import datetime
import enum

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ExamGeminiSessionStatus(str, enum.Enum):
    ACTIVE = "active"
    ACCEPTED = "accepted"
    ABANDONED = "abandoned"


class ExamGeminiGenerationSession(Base):
    __tablename__ = "exam_gemini_generation_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id"), index=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default=ExamGeminiSessionStatus.ACTIVE)
    initial_params: Mapped[dict] = mapped_column(JSONB, default=dict)
    last_raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    messages = relationship(
        "ExamGeminiGenerationMessage",
        back_populates="session",
        order_by="ExamGeminiGenerationMessage.created_at",
    )


class ExamGeminiGenerationMessage(Base):
    __tablename__ = "exam_gemini_generation_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("exam_gemini_generation_sessions.id"), index=True
    )
    role: Mapped[str] = mapped_column(String(10))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    session = relationship("ExamGeminiGenerationSession", back_populates="messages")
