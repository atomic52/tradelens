"""
Unit tests for the Robinhood CSV parser.
No external files required — fixtures are inline or committed to tests/fixtures/.
"""

from decimal import Decimal
from pathlib import Path

import pytest

from app.parsers.robinhood import parse_robinhood_csv, RawExecution

FIXTURES = Path(__file__).parent / "fixtures"


# ── Helpers ───────────────────────────────────────────────────────────────────

def csv(*rows: str) -> str:
    """Build a minimal Robinhood CSV string from data rows."""
    header = "Activity Date,Process Date,Settle Date,Instrument,Description,Trans Code,Quantity,Price,Amount"
    return "\n".join([header] + list(rows))


# ── Basic equity parsing ──────────────────────────────────────────────────────

def test_buy_equity_parsed():
    content = csv("01/07/2026,,,AAPL,Apple,Buy,10,$150.00,$1500.00")
    execs = parse_robinhood_csv(content)
    assert len(execs) == 1
    e = execs[0]
    assert e.symbol == "AAPL"
    assert e.side == "buy"
    assert e.asset_class == "equity"
    assert e.quantity == Decimal("10")
    assert e.price == Decimal("150.00")


def test_sell_equity_parsed():
    content = csv("01/10/2026,,,AAPL,Apple,Sell,10,$160.00,$1600.00")
    execs = parse_robinhood_csv(content)
    assert len(execs) == 1
    e = execs[0]
    assert e.side == "sell"
    assert e.asset_class == "equity"


def test_quantity_always_positive():
    """Sell quantities in CSVs are sometimes negative — parser must abs() them."""
    content = csv("01/10/2026,,,AAPL,Apple,Sell,-10,$160.00,$-1600.00")
    execs = parse_robinhood_csv(content)
    assert execs[0].quantity == Decimal("10")


def test_price_strips_dollar_sign():
    content = csv("01/07/2026,,,MSFT,Microsoft,Buy,5,$420.50,$2102.50")
    execs = parse_robinhood_csv(content)
    assert execs[0].price == Decimal("420.50")


def test_price_strips_comma_thousands():
    # CSV values with commas must be quoted — as a real export would do
    content = csv('01/07/2026,,,SPX,S&P 500,Buy,1,"$1,234.56","$1234.56"')
    execs = parse_robinhood_csv(content)
    assert execs[0].price == Decimal("1234.56")


def test_unknown_trans_code_skipped():
    content = csv(
        "01/07/2026,,,AAPL,Apple,Buy,10,$150.00,$1500.00",
        "01/08/2026,,,IGNORED,Wire,WIRE,1,$100.00,$100.00",
    )
    execs = parse_robinhood_csv(content)
    assert len(execs) == 1
    assert execs[0].symbol == "AAPL"


def test_empty_csv_returns_empty_list():
    content = csv()  # header only
    assert parse_robinhood_csv(content) == []


# ── Options parsing ───────────────────────────────────────────────────────────

@pytest.mark.parametrize("trans_code,expected_side", [
    ("BTO", "buy"),
    ("BTC", "buy"),
    ("BCXL", "buy"),
    ("STO", "sell"),
    ("STC", "sell"),
    ("SCXL", "sell"),
])
def test_option_trans_codes(trans_code, expected_side):
    content = csv(f"01/14/2026,,,SPX,S&P 500,{trans_code},2,$10.00,$200.00")
    execs = parse_robinhood_csv(content)
    assert len(execs) == 1
    assert execs[0].asset_class == "option"
    assert execs[0].side == expected_side


def test_symbol_uppercased():
    content = csv("01/07/2026,,,aapl,Apple,Buy,10,$150.00,$1500.00")
    execs = parse_robinhood_csv(content)
    assert execs[0].symbol == "AAPL"


# ── Fixture file ─────────────────────────────────────────────────────────────

def test_fixture_file_parses():
    """Smoke test against the committed sample CSV fixture."""
    content = (FIXTURES / "sample_trades.csv").read_text()
    execs = parse_robinhood_csv(content)

    # 7 valid rows, 1 WIRE row should be skipped
    assert len(execs) == 7

    symbols = {e.symbol for e in execs}
    assert "AAPL" in symbols
    assert "TSLA" in symbols
    assert "SPX" in symbols
    assert "IGNORED" not in symbols

    equity = [e for e in execs if e.asset_class == "equity"]
    options = [e for e in execs if e.asset_class == "option"]
    assert len(equity) == 3   # AAPL buy, AAPL sell, TSLA buy
    assert len(options) == 4  # BTO, STC, STO, BTC
