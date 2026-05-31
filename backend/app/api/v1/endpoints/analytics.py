from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_active_user
from app.db.base import get_async_session
from app.models.trade import Trade
from app.models.user import User

router = APIRouter()

Period = Literal["today", "week", "month", "ytd", "all"]


def _period_dates(period: Period) -> tuple[datetime | None, datetime | None]:
    today = date.today()
    if period == "today":
        start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
        return start, None
    if period == "week":
        monday = today - timedelta(days=today.weekday())
        return datetime(monday.year, monday.month, monday.day, tzinfo=timezone.utc), None
    if period == "month":
        return datetime(today.year, today.month, 1, tzinfo=timezone.utc), None
    if period == "ytd":
        return datetime(today.year, 1, 1, tzinfo=timezone.utc), None
    return None, None


async def _load_closed_trades(
    account_id: UUID,
    period: Period,
    session: AsyncSession,
) -> list[Trade]:
    start, end = _period_dates(period)
    stmt = (
        select(Trade)
        .where(Trade.account_id == account_id, Trade.status == "closed")
        .order_by(Trade.closed_at)
    )
    if start:
        stmt = stmt.where(Trade.closed_at >= start)
    if end:
        stmt = stmt.where(Trade.closed_at <= end)
    result = await session.execute(stmt)
    return list(result.scalars().all())


def _compute_summary(trades: list[Trade]) -> dict:
    if not trades:
        return {"total_trades": 0}

    pnls = [float(t.realized_pnl or 0) for t in trades]
    winners = [p for p in pnls if p > 0]
    losers  = [p for p in pnls if p < 0]

    total = len(pnls)
    win_rate  = len(winners) / total
    loss_rate = 1 - win_rate
    avg_winner = sum(winners) / len(winners) if winners else 0.0
    avg_loser  = sum(losers)  / len(losers)  if losers  else 0.0
    gross_profit = sum(winners)
    gross_loss   = abs(sum(losers))

    # Max drawdown via running peak tracking
    running = peak = max_dd = 0.0
    for p in pnls:
        running += p
        peak = max(peak, running)
        max_dd = max(max_dd, peak - running)

    # Avg hold time
    hold_minutes = [
        (t.closed_at - t.opened_at).total_seconds() / 60
        for t in trades
        if t.opened_at and t.closed_at
    ]

    # Streak analysis
    cur_type = None
    cur_count = max_win = max_loss = 0
    for p in pnls:
        s = "win" if p > 0 else "loss"
        if s == cur_type:
            cur_count += 1
        else:
            cur_type, cur_count = s, 1
        if s == "win":
            max_win = max(max_win, cur_count)
        else:
            max_loss = max(max_loss, cur_count)

    return {
        "total_trades": total,
        "winning_trades": len(winners),
        "losing_trades": len(losers),
        "win_rate": round(win_rate * 100, 2),
        "total_pnl": round(sum(pnls), 2),
        "gross_profit": round(gross_profit, 2),
        "gross_loss": round(gross_loss, 2),
        "profit_factor": round(gross_profit / gross_loss, 2) if gross_loss else None,
        "avg_winner": round(avg_winner, 2),
        "avg_loser": round(avg_loser, 2),
        "expectancy": round(win_rate * avg_winner + loss_rate * avg_loser, 2),
        "max_drawdown": round(max_dd, 2),
        "largest_win": round(max(winners), 2) if winners else 0,
        "largest_loss": round(min(losers), 2) if losers else 0,
        "avg_hold_minutes": round(sum(hold_minutes) / len(hold_minutes), 1) if hold_minutes else None,
        "current_streak": {"type": cur_type, "count": cur_count},
        "max_win_streak": max_win,
        "max_loss_streak": max_loss,
    }


@router.get("/accounts/{account_id}/analytics/summary")
async def get_summary(
    account_id: UUID,
    period: Period = "all",
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    trades = await _load_closed_trades(account_id, period, session)
    return _compute_summary(trades)


@router.get("/accounts/{account_id}/analytics/pnl-daily")
async def get_pnl_daily(
    account_id: UUID,
    days: int = 30,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    cutoff = datetime.now(tz=timezone.utc) - timedelta(days=days)
    result = await session.execute(
        select(Trade)
        .where(
            Trade.account_id == account_id,
            Trade.status == "closed",
            Trade.closed_at >= cutoff,
        )
        .order_by(Trade.closed_at)
    )
    trades = result.scalars().all()

    by_date: dict[str, list[float]] = defaultdict(list)
    for t in trades:
        by_date[t.closed_at.date().isoformat()].append(float(t.realized_pnl or 0))

    cumulative = 0.0
    rows = []
    for d, pnls in sorted(by_date.items()):
        day_pnl = sum(pnls)
        cumulative += day_pnl
        rows.append({
            "date": d,
            "pnl": round(day_pnl, 2),
            "trade_count": len(pnls),
            "cumulative_pnl": round(cumulative, 2),
        })
    return rows


@router.get("/accounts/{account_id}/analytics/pnl-cumulative")
async def get_pnl_cumulative(
    account_id: UUID,
    period: Period = "all",
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    trades = await _load_closed_trades(account_id, period, session)
    cumulative = 0.0
    rows = []
    for t in trades:
        cumulative += float(t.realized_pnl or 0)
        rows.append({
            "date": t.closed_at.date().isoformat(),
            "pnl": round(float(t.realized_pnl or 0), 2),
            "cumulative_pnl": round(cumulative, 2),
        })
    return rows


@router.get("/accounts/{account_id}/analytics/pnl-by-hour")
async def get_pnl_by_hour(
    account_id: UUID,
    period: Period = "all",
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    trades = await _load_closed_trades(account_id, period, session)

    buckets: dict[int, list[float]] = defaultdict(list)
    for t in trades:
        buckets[t.closed_at.hour].append(float(t.realized_pnl or 0))

    return [
        {
            "hour": h,
            "pnl": round(sum(pnls), 2),
            "trade_count": len(pnls),
            "win_rate": round(sum(1 for p in pnls if p > 0) / len(pnls) * 100, 1),
        }
        for h, pnls in sorted(buckets.items())
    ]


@router.get("/accounts/{account_id}/analytics/pnl-by-symbol")
async def get_pnl_by_symbol(
    account_id: UUID,
    period: Period = "all",
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    trades = await _load_closed_trades(account_id, period, session)

    buckets: dict[str, list[float]] = defaultdict(list)
    for t in trades:
        buckets[t.symbol].append(float(t.realized_pnl or 0))

    rows = []
    for sym, pnls in sorted(buckets.items(), key=lambda x: -abs(sum(x[1]))):
        total = sum(pnls)
        rows.append({
            "symbol": sym,
            "pnl": round(total, 2),
            "trade_count": len(pnls),
            "win_rate": round(sum(1 for p in pnls if p > 0) / len(pnls) * 100, 1),
            "avg_pnl": round(total / len(pnls), 2),
        })
    return rows


# Backward-compat alias (hidden from docs)
@router.get("/accounts/{account_id}/analytics/pnl-over-time", include_in_schema=False)
async def get_pnl_over_time_alias(
    account_id: UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    return await get_pnl_cumulative(account_id, "all", session, user)
