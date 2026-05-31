import hashlib
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.execution import Execution
from app.models.import_log import ImportLog
from app.models.trade import Trade
from app.services.trade_matcher import MatchedTrade


async def check_duplicate(account_id: UUID, file_bytes: bytes, source_type: str, session: AsyncSession) -> None:
    """Raise 409 if this file has already been imported for this account."""
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    result = await session.execute(
        select(ImportLog).where(
            ImportLog.account_id == account_id,
            ImportLog.file_hash == file_hash,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"This file has already been imported (hash={file_hash[:12]}…). "
                   "Delete existing trades first if you want to re-import.",
        )
    return file_hash


async def persist_trades(
    account_id: UUID,
    matched_trades: list[MatchedTrade],
    file_bytes: bytes,
    source_type: str,
    session: AsyncSession,
) -> dict:
    """Persist matched trades + executions and record the import log entry."""
    file_hash = hashlib.sha256(file_bytes).hexdigest()

    trades_created = 0
    executions_created = 0

    for mt in matched_trades:
        trade = Trade(
            account_id=account_id,
            symbol=mt.symbol,
            asset_class=mt.asset_class,
            direction=mt.direction,
            opened_at=mt.opened_at,
            closed_at=mt.closed_at,
            status=mt.status,
            quantity=mt.quantity,
            avg_entry=mt.avg_entry,
            avg_exit=mt.avg_exit,
            realized_pnl=mt.realized_pnl,
            fees=mt.fees,
            contract_multiplier=mt.multiplier,
        )
        session.add(trade)
        await session.flush()  # get trade.id

        for raw_ex in mt.executions:
            ex = Execution(
                account_id=account_id,
                trade_id=trade.id,
                executed_at=raw_ex.executed_at,
                symbol=raw_ex.symbol,
                side=raw_ex.side,
                quantity=raw_ex.quantity,
                price=raw_ex.price,
                fees=raw_ex.fees,
                asset_class=raw_ex.asset_class,
            )
            session.add(ex)
            executions_created += 1

        trades_created += 1

    session.add(ImportLog(
        account_id=account_id,
        file_hash=file_hash,
        source_type=source_type,
    ))

    await session.commit()

    return {
        "trades_imported": trades_created,
        "executions_imported": executions_created,
        "file_hash": file_hash,
    }
