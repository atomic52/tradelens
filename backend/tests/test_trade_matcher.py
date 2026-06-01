"""
Unit tests for FIFO trade matching logic.
Pure Python — no database, no HTTP, no external files.
"""

from datetime import datetime
from decimal import Decimal

import pytest

from app.parsers.robinhood import RawExecution
from app.services.trade_matcher import match_trades, MatchedTrade


# ── Helpers ───────────────────────────────────────────────────────────────────

def ex(
    symbol: str,
    side: str,
    qty: str,
    price: str,
    dt: str = "2026-01-01",
    fees: str = "0",
    asset_class: str = "equity",
) -> RawExecution:
    return RawExecution(
        executed_at=datetime.fromisoformat(dt),
        symbol=symbol,
        side=side,
        quantity=Decimal(qty),
        price=Decimal(price),
        fees=Decimal(fees),
        asset_class=asset_class,
    )


# ── Simple round-trips ────────────────────────────────────────────────────────

def test_simple_long_trade():
    """Buy 10 @ 100, sell 10 @ 110 → +$100 P&L."""
    trades = match_trades([
        ex("AAPL", "buy",  "10", "100", "2026-01-01"),
        ex("AAPL", "sell", "10", "110", "2026-01-02"),
    ])
    assert len(trades) == 1
    t = trades[0]
    assert t.direction == "long"
    assert t.status == "closed"
    assert t.quantity == Decimal("10")
    assert t.avg_entry == Decimal("100")
    assert t.avg_exit == Decimal("110")
    assert t.realized_pnl == Decimal("100")  # (110-100)*10*1


def test_simple_short_trade():
    """Sell 5 @ 200, buy 5 @ 180 → +$100 P&L."""
    trades = match_trades([
        ex("TSLA", "sell", "5", "200", "2026-01-01"),
        ex("TSLA", "buy",  "5", "180", "2026-01-02"),
    ])
    assert len(trades) == 1
    t = trades[0]
    assert t.direction == "short"
    assert t.status == "closed"
    assert t.realized_pnl == Decimal("100")  # (200-180)*5*1


def test_fees_deducted_from_pnl():
    """$2 fee on the closing leg reduces P&L."""
    trades = match_trades([
        ex("AAPL", "buy",  "10", "100", fees="0"),
        ex("AAPL", "sell", "10", "110", fees="2"),
    ])
    assert trades[0].realized_pnl == Decimal("98")  # 100 - 2


def test_open_position_no_close():
    """Buy with no sell → open trade, no P&L."""
    trades = match_trades([
        ex("AAPL", "buy", "10", "100"),
    ])
    assert len(trades) == 1
    t = trades[0]
    assert t.status == "open"
    assert t.realized_pnl is None
    assert t.closed_at is None


# ── Multiple fills ────────────────────────────────────────────────────────────

def test_avg_entry_across_multiple_buys():
    """2 buys at different prices → weighted avg entry."""
    trades = match_trades([
        ex("AAPL", "buy",  "10", "100", "2026-01-01"),
        ex("AAPL", "buy",  "10", "120", "2026-01-02"),
        ex("AAPL", "sell", "20", "130", "2026-01-03"),
    ])
    assert len(trades) == 1
    t = trades[0]
    assert t.avg_entry == Decimal("110")  # (10*100 + 10*120) / 20
    assert t.quantity == Decimal("20")
    assert t.realized_pnl == Decimal("400")  # (130-110)*20


def test_partial_close_creates_two_trades():
    """Buy 10, sell 4 → 1 closed (qty=4) + 1 open (qty=6)."""
    trades = match_trades([
        ex("AAPL", "buy",  "10", "100", "2026-01-01"),
        ex("AAPL", "sell",  "4", "120", "2026-01-02"),
    ])
    closed = [t for t in trades if t.status == "closed"]
    open_  = [t for t in trades if t.status == "open"]
    assert len(closed) == 1
    assert len(open_) == 1
    assert closed[0].quantity == Decimal("4")
    assert open_[0].quantity == Decimal("6")
    assert closed[0].realized_pnl == Decimal("80")  # (120-100)*4


def test_multiple_partial_closes():
    """Buy 10, sell 3, sell 3, sell 4 → 3 closed trades."""
    trades = match_trades([
        ex("AAPL", "buy",  "10", "100", "2026-01-01"),
        ex("AAPL", "sell",  "3", "110", "2026-01-02"),
        ex("AAPL", "sell",  "3", "115", "2026-01-03"),
        ex("AAPL", "sell",  "4", "120", "2026-01-04"),
    ])
    closed = [t for t in trades if t.status == "closed"]
    assert len(closed) == 3
    pnls = [t.realized_pnl for t in closed]
    assert Decimal("30") in pnls   # (110-100)*3
    assert Decimal("45") in pnls   # (115-100)*3
    assert Decimal("80") in pnls   # (120-100)*4


# ── Multiple symbols ──────────────────────────────────────────────────────────

def test_two_symbols_independent():
    """Executions for different symbols don't interfere."""
    trades = match_trades([
        ex("AAPL", "buy",  "10", "100", "2026-01-01"),
        ex("TSLA", "buy",   "5", "200", "2026-01-01"),
        ex("AAPL", "sell", "10", "110", "2026-01-02"),
        ex("TSLA", "sell",  "5", "220", "2026-01-02"),
    ])
    assert len(trades) == 2
    aapl = next(t for t in trades if t.symbol == "AAPL")
    tsla = next(t for t in trades if t.symbol == "TSLA")
    assert aapl.realized_pnl == Decimal("100")
    assert tsla.realized_pnl == Decimal("100")


# ── Contract multiplier ───────────────────────────────────────────────────────

def test_futures_multiplier_applied():
    """ES multiplier = 50: 1 tick = $50."""
    trades = match_trades(
        [
            ex("ES_2026_06", "buy",  "1", "5000", asset_class="future"),
            ex("ES_2026_06", "sell", "1", "5010", asset_class="future"),
        ],
        multiplier=Decimal("50"),
    )
    assert len(trades) == 1
    # (5010 - 5000) * 1 contract * 50 = $500
    assert trades[0].realized_pnl == Decimal("500")


def test_options_multiplier_100():
    """Options multiplier = 100: 10 contracts × $1 move = $1000."""
    trades = match_trades(
        [
            ex("SPX_20260117_P5000", "buy",  "10", "5.00", asset_class="option"),
            ex("SPX_20260117_P5000", "sell", "10", "6.00", asset_class="option"),
        ],
        multiplier=Decimal("100"),
    )
    assert trades[0].realized_pnl == Decimal("1000")


# ── Sort order ────────────────────────────────────────────────────────────────

def test_results_sorted_by_opened_at():
    """Completed trades should be sorted ascending by open time."""
    trades = match_trades([
        ex("TSLA", "buy",  "1", "200", "2026-01-03"),
        ex("AAPL", "buy",  "1", "100", "2026-01-01"),
        ex("AAPL", "sell", "1", "110", "2026-01-02"),
        ex("TSLA", "sell", "1", "210", "2026-01-04"),
    ])
    assert trades[0].symbol == "AAPL"
    assert trades[1].symbol == "TSLA"


# ── FIFO ordering ─────────────────────────────────────────────────────────────

def test_fifo_uses_oldest_entry_first():
    """
    Buy 5 @ 100, buy 5 @ 150, sell 5 → should close the 100 lot first (FIFO).
    P&L = (120-100)*5 = 100, not (120-150)*5 = -150.
    """
    trades = match_trades([
        ex("AAPL", "buy",  "5", "100", "2026-01-01"),
        ex("AAPL", "buy",  "5", "150", "2026-01-02"),
        ex("AAPL", "sell", "5", "120", "2026-01-03"),
    ])
    closed = [t for t in trades if t.status == "closed"]
    assert len(closed) == 1
    assert closed[0].avg_entry == Decimal("100")
    assert closed[0].realized_pnl == Decimal("100")


# ── Edge cases ────────────────────────────────────────────────────────────────

def test_empty_executions_returns_empty():
    assert match_trades([]) == []


def test_exact_round_trip_leaves_no_open():
    """After a perfect close, no open position should remain."""
    trades = match_trades([
        ex("AAPL", "buy",  "3", "100"),
        ex("AAPL", "sell", "3", "105"),
    ])
    assert all(t.status == "closed" for t in trades)
    assert len(trades) == 1
