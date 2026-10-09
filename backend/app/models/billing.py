"""Portefeuilles de crédits IA, réservations d'appels et commandes PayMe."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AiWallet(Base):
    __tablename__ = "ai_wallets"
    __table_args__ = (UniqueConstraint("user_id", "product", name="uq_ai_wallets_user_product"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    product: Mapped[str] = mapped_column(String(32), index=True)
    free_remaining: Mapped[int] = mapped_column(Integer, default=0)
    paid_remaining: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AiUsage(Base):
    __tablename__ = "ai_usages"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    product: Mapped[str] = mapped_column(String(32), index=True)
    status: Mapped[str] = mapped_column(String(20), index=True)
    generation_session_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    slots_total: Mapped[int] = mapped_column(Integer, default=1)
    slots_used: Mapped[int] = mapped_column(Integer, default=0)
    charged_bucket: Mapped[str] = mapped_column(String(10), default="free")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PaymentOrder(Base):
    __tablename__ = "payment_orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    pack_code: Mapped[str] = mapped_column(String(40))
    product: Mapped[str] = mapped_column(String(32))
    credits: Mapped[int] = mapped_column(Integer)
    amount_agorot: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), index=True, default="pending")
    transaction_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    payme_sale_id: Mapped[str | None] = mapped_column(String(80), unique=True, nullable=True)
    payme_transaction_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AiBillingSettings(Base):
    """Réglages métier des crédits (une seule ligne, id=1)."""

    __tablename__ = "ai_billing_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_free_credits: Mapped[int] = mapped_column(Integer, default=5)
    teacher_free_credits: Mapped[int] = mapped_column(Integer, default=3)
    calls_per_teacher_credit: Mapped[int] = mapped_column(Integer, default=5)
    packs: Mapped[list] = mapped_column(JSONB, default=list)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
