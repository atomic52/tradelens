import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Trade(Base):
    """A matched round-trip (open → close). Computed from executions."""

    __tablename__ = "trades"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)

    symbol: Mapped[str] = mapped_column(String(100), nullable=False)
    asset_class: Mapped[str] = mapped_column(String(20), nullable=False, default="equity")
    direction: Mapped[str] = mapped_column(String(5), nullable=False)  # "long" | "short"

    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(10), nullable=False, default="open")  # "open" | "closed"

    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 8), nullable=False)
    avg_entry: Mapped[Decimal] = mapped_column(Numeric(18, 8), nullable=False)
    avg_exit: Mapped[Decimal | None] = mapped_column(Numeric(18, 8), nullable=True)

    realized_pnl: Mapped[Decimal | None] = mapped_column(Numeric(18, 8), nullable=True)
    fees: Mapped[Decimal] = mapped_column(Numeric(18, 8), nullable=False, default=0)
    contract_multiplier: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False, server_default="1")

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[str | None] = mapped_column(String(500), nullable=True)  # comma-separated

    account = relationship("Account", back_populates="trades")
    executions = relationship("Execution", back_populates="trade")
