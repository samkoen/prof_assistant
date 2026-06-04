from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TeacherContentShare(Base):
    __tablename__ = "teacher_content_shares"

    id: Mapped[int] = mapped_column(primary_key=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    recipient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    share_type: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    source_exam_id: Mapped[int | None] = mapped_column(ForeignKey("exams.id"), nullable=True)
    source_catalog_id: Mapped[int | None] = mapped_column(
        ForeignKey("course_catalogs.id"), nullable=True
    )
    target_catalog_id: Mapped[int | None] = mapped_column(
        ForeignKey("course_catalogs.id"), nullable=True
    )
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
