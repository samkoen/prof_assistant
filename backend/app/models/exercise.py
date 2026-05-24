from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True)
    catalog_course_id: Mapped[int] = mapped_column(ForeignKey("course_catalogs.id"), index=True)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    scope_teacher_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    scope_academic_year: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    scope_semester: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    scope_group_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    catalog_course = relationship("CourseCatalog", back_populates="exercises")
    creator = relationship("User", foreign_keys=[created_by_id])
    scope_teacher = relationship("User", foreign_keys=[scope_teacher_id])
