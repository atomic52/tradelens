import tempfile
from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_active_user
from app.db.base import get_async_session
from app.models.account import Account
from app.models.user import User
from app.parsers.rh_futures_pdf import parse_rh_futures_pdf
from app.parsers.rh_nonfutures_pdf import parse_rh_nonfutures_pdf
from app.parsers.robinhood import RawExecution, parse_robinhood_csv
from app.services.contract_specs import get_multiplier
from app.services.import_service import check_duplicate, persist_trades
from app.services.trade_matcher import match_trades

router = APIRouter()


async def _get_account_or_404(
    account_id: UUID,
    user_id: UUID,
    session: AsyncSession,
) -> Account:
    result = await session.execute(
        select(Account).where(Account.id == account_id, Account.user_id == user_id)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


def _match_by_symbol(raw_executions: list[RawExecution]) -> list:
    """Group executions by symbol, apply per-symbol multiplier, run FIFO matcher."""
    by_symbol: dict[str, list[RawExecution]] = defaultdict(list)
    for ex in raw_executions:
        by_symbol[ex.symbol].append(ex)

    all_matched = []
    for symbol, execs in by_symbol.items():
        asset_class = execs[0].asset_class
        multiplier = get_multiplier(symbol, asset_class)
        all_matched.extend(match_trades(execs, multiplier=multiplier))
    return all_matched


@router.post("/accounts/{account_id}/import/robinhood-csv")
async def import_robinhood_csv(
    account_id: UUID,
    file: UploadFile,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    await _get_account_or_404(account_id, user.id, session)
    content_bytes = await file.read()
    await check_duplicate(account_id, content_bytes, "robinhood-csv", session)

    raw_executions = parse_robinhood_csv(content_bytes.decode("utf-8"))
    if not raw_executions:
        raise HTTPException(status_code=422, detail="No valid executions found in CSV")

    matched = _match_by_symbol(raw_executions)
    return await persist_trades(account_id, matched, content_bytes, "robinhood-csv", session)


@router.post("/accounts/{account_id}/import/futures-pdf")
async def import_futures_pdf(
    account_id: UUID,
    file: UploadFile,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    await _get_account_or_404(account_id, user.id, session)
    content_bytes = await file.read()
    await check_duplicate(account_id, content_bytes, "futures-pdf", session)

    # pdfplumber needs a file path — write to a temp file
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(content_bytes)
        tmp_path = tmp.name

    raw_executions, _pnl_summaries = parse_rh_futures_pdf(tmp_path)
    if not raw_executions:
        raise HTTPException(status_code=422, detail="No executions found in PDF")

    matched = _match_by_symbol(raw_executions)
    return await persist_trades(account_id, matched, content_bytes, "futures-pdf", session)


@router.post("/accounts/{account_id}/import/nonfutures-pdf")
async def import_nonfutures_pdf(
    account_id: UUID,
    file: UploadFile,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    await _get_account_or_404(account_id, user.id, session)
    content_bytes = await file.read()
    await check_duplicate(account_id, content_bytes, "nonfutures-pdf", session)

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(content_bytes)
        tmp_path = tmp.name

    raw_executions = parse_rh_nonfutures_pdf(tmp_path)
    if not raw_executions:
        raise HTTPException(status_code=422, detail="No executions found in PDF")

    matched = _match_by_symbol(raw_executions)
    return await persist_trades(account_id, matched, content_bytes, "nonfutures-pdf", session)
