from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AccountCreate(BaseModel):
    name: str
    broker: str


class AccountRead(BaseModel):
    id: UUID
    name: str
    broker: str
    created_at: datetime

    model_config = {"from_attributes": True}
