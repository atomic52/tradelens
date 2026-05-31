from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_active_user
from app.db.base import get_async_session
from app.models.account import Account
from app.models.user import User
from app.schemas.account import AccountCreate, AccountRead

router = APIRouter()


@router.get("/accounts", response_model=list[AccountRead])
async def list_accounts(
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(Account).where(Account.user_id == user.id).order_by(Account.created_at)
    )
    return result.scalars().all()


@router.post("/accounts", response_model=AccountRead, status_code=201)
async def create_account(
    body: AccountCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    account = Account(name=body.name, broker=body.broker, user_id=user.id)
    session.add(account)
    await session.commit()
    await session.refresh(account)
    return account


@router.delete("/accounts/{account_id}", status_code=204)
async def delete_account(
    account_id: UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(Account).where(Account.id == account_id, Account.user_id == user.id)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    await session.delete(account)
    await session.commit()
