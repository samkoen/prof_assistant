from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OfferingTeacher(Base):
    __tablename__ = "offering_teachers"
    __table_args__ = (UniqueConstraint("offering_id", "teacher_id", name="uq_offering_teacher"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    offering_id: Mapped[int] = mapped_column(ForeignKey("course_offerings.id"), index=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    offering = relationship("CourseOffering", back_populates="teacher_members")
    teacher = relationship("User", foreign_keys=[teacher_id])


class OfferingTeacherInvite(Base):
    __tablename__ = "offering_teacher_invites"
    __table_args__ = (
        UniqueConstraint("offering_id", "recipient_id", name="uq_offering_teacher_invite_pair"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    offering_id: Mapped[int] = mapped_column(ForeignKey("course_offerings.id"), index=True)
    inviter_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    recipient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    offering = relationship("CourseOffering")
    inviter = relationship("User", foreign_keys=[inviter_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
