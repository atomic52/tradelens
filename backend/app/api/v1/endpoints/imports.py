import os
import tempfile
from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_active_user
from app.db.base import get_async_session
from app.models.account import Account
from app.models.import_log import ImportLog
from app.models.user import User
from app.parsers.rh_futures_pdf import parse_rh_futures_pdf
from app.parsers.rh_nonfutures_pdf import parse_rh_nonfutures_pdf
from app.parsers.robinhood import RawExecution, parse_robinhood_csv
from app.services.contract_specs import get_multiplier
from app.services.import_service import check_duplicate, persist_trades
from app.services.trade_matcher import match_trades

router = APIRouter()

FREE_TIER_IMPORT_LIMIT = 10
MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20 MB


async def _read_upload(file: UploadFile, allowed_content_types: list[str]) -> bytes:
    """Read upload, enforcing size limit and content-type."""
    if file.content_type and file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Expected: {', '.join(allowed_content_types)}",
        )
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024*1024)} MB.",
        )
    return content


async def _check_import_limit(user: User, session: AsyncSession) -> None:
    """Raise 402 if the user has reached the free-tier import limit."""
    # Pro users have unlimited imports
    if user.subscription_status == "pro":
        return
    # Count all imports across every account belonging to this user
    result = await session.execute(
        select(func.count(ImportLog.id))
        .join(Account, ImportLog.account_id == Account.id)
        .where(Account.user_id == user.id)
    )
    total = result.scalar_one()
    if total >= FREE_TIER_IMPORT_LIMIT:
        raise HTTPException(
            status_code=402,
            detail=(
                f"Free tier limit reached ({FREE_TIER_IMPORT_LIMIT} imports). "
                "Upgrade to Pro for unlimited imports."
            ),
        )


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


@router.get("/imports/usage")
async def get_import_usage(
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """Return how many imports the user has used and the free-tier limit."""
    result = await session.execute(
        select(func.count(ImportLog.id))
        .join(Account, ImportLog.account_id == Account.id)
        .where(Account.user_id == user.id)
    )
    used = result.scalar_one()
    if user.subscription_status == "pro":
        return {"used": used, "limit": None, "plan": "pro"}
    return {"used": used, "limit": FREE_TIER_IMPORT_LIMIT, "plan": "free"}


@router.post("/accounts/{account_id}/import/robinhood-csv")
async def import_robinhood_csv(
    account_id: UUID,
    file: UploadFile,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    await _check_import_limit(user, session)
    await _get_account_or_404(account_id, user.id, session)
    content_bytes = await _read_upload(file, ["text/csv", "application/csv", "application/octet-stream", "text/plain"])
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
    await _check_import_limit(user, session)
    await _get_account_or_404(account_id, user.id, session)
    content_bytes = await _read_upload(file, ["application/pdf", "application/octet-stream"])
    await check_duplicate(account_id, content_bytes, "futures-pdf", session)

    # pdfplumber needs a file path — write to a temp file, always clean up
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(content_bytes)
        tmp_path = tmp.name
    try:
        raw_executions, _pnl_summaries = parse_rh_futures_pdf(tmp_path)
    finally:
        os.unlink(tmp_path)
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
    await _check_import_limit(user, session)
    await _get_account_or_404(account_id, user.id, session)
    content_bytes = await _read_upload(file, ["application/pdf", "application/octet-stream"])
    await check_duplicate(account_id, content_bytes, "nonfutures-pdf", session)

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(content_bytes)
        tmp_path = tmp.name
    try:
        raw_executions = parse_rh_nonfutures_pdf(tmp_path)
    finally:
        os.unlink(tmp_path)
    if not raw_executions:
        raise HTTPException(status_code=422, detail="No executions found in PDF")

    matched = _match_by_symbol(raw_executions)
    return await persist_trades(account_id, matched, content_bytes, "nonfutures-pdf", session)
