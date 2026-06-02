from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(SQLAlchemyBaseUserTableUUID, Base):
    # Stripe billing
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True, default=None)
    subscription_status: Mapped[str] = mapped_column(String(20), nullable=False, default="free")
    # "free" | "pro" | "canceled"

    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")
