from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class TradeRead(BaseModel):
    id: UUID
    account_id: UUID
    symbol: str
    asset_class: str
    direction: str
    opened_at: datetime
    closed_at: datetime | None
    status: str
    quantity: Decimal
    avg_entry: Decimal
    avg_exit: Decimal | None
    realized_pnl: Decimal | None
    fees: Decimal
    contract_multiplier: Decimal
    notes: str | None
    tags: str | None

    model_config = {"from_attributes": True}


class TradeUpdate(BaseModel):
    notes: str | None = None
    tags: str | None = None
