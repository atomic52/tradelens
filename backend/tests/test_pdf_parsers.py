"""
Smoke tests for the PDF parsers using the real sample statements.
Run with: poetry run pytest tests/test_pdf_parsers.py -v
"""

from decimal import Decimal
from pathlib import Path

import pytest

SAMPLES = Path.home() / "Downloads"

DAILY_FUTURES = SAMPLES / "daily RH statemet.pdf"
MONTHLY_FUTURES = SAMPLES / "monthly RH statement.pdf"
DEC_FUTURES = SAMPLES / "dec-monthly-futures.pdf"
NON_FUTURES = SAMPLES / "non-futures-monthly.pdf"


# ── Futures parsers ───────────────────────────────────────────────────────────

@pytest.mark.skipif(not DAILY_FUTURES.exists(), reason="sample PDF not found")
def test_daily_futures_executions():
    from app.parsers.rh_futures_pdf import parse_rh_futures_pdf

    executions, summaries = parse_rh_futures_pdf(DAILY_FUTURES)

    # Daily statement has 4 fills: 2 buys + 2 sells of SI
    assert len(executions) == 4, f"expected 4 executions, got {len(executions)}"

    symbols = {e.symbol for e in executions}
    assert all("SI" in s for s in symbols), f"unexpected symbols: {symbols}"

    sides = [e.side for e in executions]
    assert sides.count("buy") == 2
    assert sides.count("sell") == 2

    prices = {e.price for e in executions}
    assert Decimal("73.89") in prices or any(p > 73 for p in prices)


@pytest.mark.skipif(not DAILY_FUTURES.exists(), reason="sample PDF not found")
def test_daily_futures_ps_summary():
    from app.parsers.rh_futures_pdf import parse_rh_futures_pdf

    _, summaries = parse_rh_futures_pdf(DAILY_FUTURES)

    # Daily statement has one P&S summary row: SI with gross P&L = 2850
    assert len(summaries) >= 1, f"expected ≥1 summary row, got {len(summaries)}"
    si_rows = [s for s in summaries if s.symbol.startswith("SI")]
    assert si_rows, "expected SI in P&S summary"
    assert si_rows[0].gross_pnl == Decimal("2850.000000") or si_rows[0].gross_pnl == Decimal("2850")


@pytest.mark.skipif(not MONTHLY_FUTURES.exists(), reason="sample PDF not found")
def test_monthly_futures_executions():
    from app.parsers.rh_futures_pdf import parse_rh_futures_pdf

    executions, summaries = parse_rh_futures_pdf(MONTHLY_FUTURES)

    assert len(executions) > 0, "expected executions in monthly futures PDF"
    asset_classes = {e.asset_class for e in executions}
    assert asset_classes <= {"future", "event_contract"}, f"unexpected asset classes: {asset_classes}"
    assert "future" in asset_classes, "expected at least some futures"

    symbols = {e.symbol for e in executions}
    # Monthly contains ES, GC, SI (now with canonical suffix, e.g. ES_2026_06)
    assert any(s.startswith("ES") for s in symbols), f"expected ES futures, got: {symbols}"

    assert len(summaries) > 0, "expected P&S summary rows"
    pnl_symbols = {s.symbol for s in summaries}
    assert any(sym.startswith("ES") for sym in pnl_symbols), f"expected ES in P&L summaries, got: {pnl_symbols}"


@pytest.mark.skipif(not MONTHLY_FUTURES.exists(), reason="sample PDF not found")
def test_monthly_futures_ps_pnl():
    from app.parsers.rh_futures_pdf import parse_rh_futures_pdf

    _, summaries = parse_rh_futures_pdf(MONTHLY_FUTURES)

    # From the sample: 2026-04-01 ES gross P&L = 40025
    es_rows = [s for s in summaries if s.symbol.startswith("ES")]
    assert es_rows, "expected ES in monthly P&S summary"

    first_es_date = [s for s in es_rows if str(s.trade_date) == "2026-04-01"]
    if first_es_date:
        assert first_es_date[0].gross_pnl == Decimal("40025")


# ── December multi-page futures ──────────────────────────────────────────────

@pytest.mark.skipif(not DEC_FUTURES.exists(), reason="sample PDF not found")
def test_dec_futures_multipage_executions():
    from app.parsers.rh_futures_pdf import parse_rh_futures_pdf

    executions, summaries = parse_rh_futures_pdf(DEC_FUTURES)

    assert len(executions) > 10, f"expected many executions, got {len(executions)}"
    symbols = {e.symbol for e in executions}
    assert any(s.startswith("ES") for s in symbols), f"expected ES in {symbols}"
    assert any(s.startswith("NQ") for s in symbols), f"expected NQ in {symbols}"
    assert any("KXNFLGAME" in s for s in symbols), f"expected event contracts in {symbols}"


@pytest.mark.skipif(not DEC_FUTURES.exists(), reason="sample PDF not found")
def test_dec_futures_asset_classes():
    from app.parsers.rh_futures_pdf import parse_rh_futures_pdf

    executions, _ = parse_rh_futures_pdf(DEC_FUTURES)

    assert any(e.asset_class == "future" for e in executions), "expected standard futures"
    assert any(e.asset_class == "event_contract" for e in executions), "expected event contracts"


@pytest.mark.skipif(not DEC_FUTURES.exists(), reason="sample PDF not found")
def test_dec_futures_pnl_summary():
    from app.parsers.rh_futures_pdf import parse_rh_futures_pdf

    _, summaries = parse_rh_futures_pdf(DEC_FUTURES)

    assert len(summaries) >= 4, f"expected ≥4 P&L rows, got {len(summaries)}"

    nq_rows = [s for s in summaries if s.symbol.startswith("NQ")]
    assert nq_rows, "expected NQ in P&L summaries"
    assert any(s.gross_pnl == Decimal("7655") for s in nq_rows), \
        f"NQ pnl expected 7655, got: {[s.gross_pnl for s in nq_rows]}"

    event_rows = [s for s in summaries if "KXNFLGAME" in s.symbol]
    assert len(event_rows) >= 2, f"expected ≥2 event contract P&L rows, got {len(event_rows)}"


# ── Non-futures parser ────────────────────────────────────────────────────────

@pytest.mark.skipif(not NON_FUTURES.exists(), reason="sample PDF not found")
def test_nonfutures_returns_executions():
    from app.parsers.rh_nonfutures_pdf import parse_rh_nonfutures_pdf

    executions = parse_rh_nonfutures_pdf(NON_FUTURES)

    assert len(executions) > 0, "expected executions from non-futures PDF"


@pytest.mark.skipif(not NON_FUTURES.exists(), reason="sample PDF not found")
def test_nonfutures_no_futures_sweeps():
    from app.parsers.rh_nonfutures_pdf import parse_rh_nonfutures_pdf

    executions = parse_rh_nonfutures_pdf(NON_FUTURES)

    # FUTSWP rows must be excluded
    for ex in executions:
        assert "FUTSWP" not in ex.symbol, f"FUTSWP leaked into executions: {ex}"


@pytest.mark.skipif(not NON_FUTURES.exists(), reason="sample PDF not found")
def test_nonfutures_options_parsed():
    from app.parsers.rh_nonfutures_pdf import parse_rh_nonfutures_pdf

    executions = parse_rh_nonfutures_pdf(NON_FUTURES)

    option_execs = [e for e in executions if e.asset_class == "option"]
    assert len(option_execs) > 0, "expected option executions"

    # SPX puts should have canonical symbols like SPX_20260417_P6815
    spx_opts = [e for e in option_execs if e.symbol.startswith("SPX")]
    assert spx_opts, f"expected SPX options, got symbols: {[e.symbol for e in option_execs[:5]]}"

    first = spx_opts[0]
    assert "_" in first.symbol, f"option symbol not in canonical form: {first.symbol}"
    assert first.quantity > 0
    assert first.price > 0


@pytest.mark.skipif(not NON_FUTURES.exists(), reason="sample PDF not found")
def test_nonfutures_stock_sales_parsed():
    from app.parsers.rh_nonfutures_pdf import parse_rh_nonfutures_pdf

    executions = parse_rh_nonfutures_pdf(NON_FUTURES)

    equity_sells = [e for e in executions if e.asset_class == "equity" and e.side == "sell"]
    # The monthly has sells of SNAP, TTD, V, PGNY, KLAR at minimum
    assert len(equity_sells) > 0, "expected equity sell executions"

    symbols = {e.symbol for e in equity_sells}
    assert "SNAP" in symbols or "TTD" in symbols or "V" in symbols, \
        f"expected known stock symbols, got: {symbols}"


@pytest.mark.skipif(not NON_FUTURES.exists(), reason="sample PDF not found")
def test_nonfutures_asset_classes():
    from app.parsers.rh_nonfutures_pdf import parse_rh_nonfutures_pdf

    executions = parse_rh_nonfutures_pdf(NON_FUTURES)

    classes = {e.asset_class for e in executions}
    # Should only have equity and option — no futures
    assert "future" not in classes, f"futures leaked into non-futures parser: {classes}"
    assert classes.issubset({"equity", "option"}), f"unexpected asset classes: {classes}"
