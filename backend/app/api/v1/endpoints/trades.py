from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_active_user
from app.db.base import get_async_session
from app.models.account import Account
from app.models.trade import Trade
from app.models.user import User
from app.schemas.trade import TradeRead, TradeUpdate

router = APIRouter()


async def _verify_trade_ownership(
    trade_id: UUID,
    user_id: UUID,
    session: AsyncSession,
) -> Trade:
    """Return trade only if it belongs to an account owned by user."""
    result = await session.execute(
        select(Trade)
        .join(Account, Trade.account_id == Account.id)
        .where(Trade.id == trade_id, Account.user_id == user_id)
    )
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    return trade


@router.get("/accounts/{account_id}/trades", response_model=list[TradeRead])
async def list_trades(
    account_id: UUID,
    status: Literal["open", "closed"] | None = None,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    stmt = (
        select(Trade)
        .join(Account, Trade.account_id == Account.id)
        .where(Trade.account_id == account_id, Account.user_id == user.id)
        .order_by(Trade.opened_at.desc())
    )
    if status:
        stmt = stmt.where(Trade.status == status)
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/trades/{trade_id}", response_model=TradeRead)
async def get_trade(
    trade_id: UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    return await _verify_trade_ownership(trade_id, user.id, session)


@router.patch("/trades/{trade_id}", response_model=TradeRead)
async def update_trade(
    trade_id: UUID,
    body: TradeUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    trade = await _verify_trade_ownership(trade_id, user.id, session)

    if body.notes is not None:
        trade.notes = body.notes
    if body.tags is not None:
        trade.tags = body.tags

    await session.commit()
    await session.refresh(trade)
    return trade


@router.delete("/trades/{trade_id}", status_code=204)
async def delete_trade(
    trade_id: UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    trade = await _verify_trade_ownership(trade_id, user.id, session)
    await session.delete(trade)
    await session.commit()
