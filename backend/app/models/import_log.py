import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ImportLog(Base):
    """Tracks every successful import to prevent duplicate re-imports."""

    __tablename__ = "import_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)
    file_hash: Mapped[str] = mapped_column(String(64), nullable=False)   # SHA-256 hex
    source_type: Mapped[str] = mapped_column(String(30), nullable=False)  # "robinhood-csv" | "futures-pdf" | "nonfutures-pdf"
    imported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
