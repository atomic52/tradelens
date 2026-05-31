from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(SQLAlchemyBaseUserTableUUID, Base):
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")
