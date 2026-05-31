"""
Parser for Robinhood Derivatives, LLC futures PDF statements.
Handles both daily and monthly statement formats (identical layout).

Table layout — sections span multiple pages:
  - "Trade Confirmations" (daily) / "Monthly Trade Confirmations":
      columns: Trade Date | AT | Qty Long | Qty Short | Subtype | Symbol |
               Contract Year Month | Exchange | Exp Date | Trade Price |
               Currency Code | Trade Type | Description
      Continuation pages have NO header row — they are identified by starting
      with a date value and matching column count.

  - "Purchase and Sale Summary":
      columns: Trade Date | AT | Total Qty Long | Total Qty Short | Subtype |
               Symbol | Contract Year Month | Exchange | Exp Date | Gross P&L |
               Currency Code | Description

  - "Trade Confirmation Summary" signals the END of the confirmations section.

Asset classes emitted:
  "future"         — standard CME/CBOT/COMEX futures (ES, NQ, GC, SI, …)
  "event_contract" — Kalshi event contracts (KXNFLGAME-*, etc.)
"""

import re
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from enum import Enum, auto
from pathlib import Path

import pdfplumber

from app.parsers.robinhood import RawExecution


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class FuturesPnLSummary:
    trade_date: date
    symbol: str
    contract_year: int
    contract_month: int
    exchange: str
    exp_date: date
    qty_long: Decimal
    qty_short: Decimal
    gross_pnl: Decimal
    currency: str
    subtype: str  # "" for futures, "YES"/"NO" for event contracts


# ── Section state machine ─────────────────────────────────────────────────────

class _Section(Enum):
    UNKNOWN = auto()
    CONFIRMATIONS = auto()
    PS_SUMMARY = auto()


# ── Helpers ───────────────────────────────────────────────────────────────────

_DATE_RE = re.compile(r"^\d{4}-\d{1,2}-\d{1,2}$")


def _clean(v: str | None) -> str:
    return (v or "").strip().replace("\n", "")


def _to_decimal(v: str | None) -> Decimal | None:
    s = _clean(v).replace(",", "")
    try:
        return Decimal(s) if s else None
    except InvalidOperation:
        return None


def _to_date(v: str | None) -> date | None:
    s = _clean(v)
    if _DATE_RE.match(s):
        try:
            return datetime.strptime(s, "%Y-%m-%d").date()
        except ValueError:
            pass
    return None


def _parse_contract_year_month(v: str | None) -> tuple[int, int] | None:
    """Parse "2025 12" → (2025, 12). Returns None for event contracts (empty)."""
    s = _clean(v)
    parts = s.split()
    if len(parts) == 2:
        try:
            return int(parts[0]), int(parts[1])
        except ValueError:
            pass
    return None


def _build_futures_symbol(symbol: str, cym: str, exchange: str) -> str:
    """
    Build canonical symbol:
      - Standard futures: "ES_2025_12"
      - Event contracts (Kalshi, empty CYM): use raw symbol unchanged
    """
    if exchange.upper() == "KALSHI" or not _clean(cym):
        return symbol.upper()
    parsed = _parse_contract_year_month(cym)
    if parsed:
        y, m = parsed
        return f"{symbol.upper()}_{y}_{m:02d}"
    return symbol.upper()


def _row_cells(row: list) -> list[str]:
    return [_clean(c) for c in row]


def _is_date_cell(s: str) -> bool:
    return bool(_DATE_RE.match(_clean(s)))


# ── Header detection ──────────────────────────────────────────────────────────

def _detect_section(cells: list[str]) -> _Section | None:
    """Identify what section a header row introduces, or None if not a header."""
    t = " ".join(cells).lower()
    if "qty long" in t and "qty short" in t and "trade price" in t:
        return _Section.CONFIRMATIONS
    if "gross p&l" in t and "total qty long" in t:
        return _Section.PS_SUMMARY
    return None


def _is_section_terminator(cells: list[str]) -> bool:
    """
    True when the row is a header for a section that ENDS the current one.
    (Trade Confirmation Summary, Purchase and Sale header, Journal Entries, etc.)
    """
    t = " ".join(cells).lower()
    return (
        ("avg long" in t and "total qty" in t)   # Trade Confirmation Summary
        or ("qty buy offset" in t)                # Purchase and Sale
        or ("journal entries" in t)
        or ("open positions" in t)
        or ("date" in t and "description" in t and "credit/debit" in t)  # Journal
    )


def _is_data_row(cells: list[str], expected_ncols: int) -> bool:
    """True if this row looks like a data continuation (starts with date, right col count)."""
    if len(cells) < expected_ncols - 2:
        return False
    return _is_date_cell(cells[0])


# ── Column schema ─────────────────────────────────────────────────────────────

@dataclass
class _ConfirmationsSchema:
    date: int
    qty_long: int
    qty_short: int
    subtype: int
    symbol: int
    cym: int       # Contract Year Month (merged "2025 12")
    exchange: int
    exp_date: int
    price: int
    ncols: int


def _build_confirmations_schema(header: list[str]) -> _ConfirmationsSchema | None:
    idx = {re.sub(r"\s+", " ", c.lower()): i for i, c in enumerate(header) if c}
    def g(name: str) -> int | None:
        return idx.get(name)

    i_date = g("trade date")
    i_qlong = g("qty long")
    i_qshort = g("qty short")
    i_subtype = g("subtype")
    i_symbol = g("symbol")
    i_cym = g("contract year month")
    i_exchange = g("exchange")
    i_exp = g("exp date")
    i_price = g("trade price")

    required = [i_date, i_qlong, i_qshort, i_symbol, i_price]
    if any(x is None for x in required):
        return None

    return _ConfirmationsSchema(
        date=i_date, qty_long=i_qlong, qty_short=i_qshort,  # type: ignore[arg-type]
        subtype=i_subtype or 4, symbol=i_symbol,  # type: ignore[arg-type]
        cym=i_cym or 6, exchange=i_exchange or 7,  # type: ignore[arg-type]
        exp_date=i_exp or 8, price=i_price,  # type: ignore[arg-type]
        ncols=len(header),
    )


@dataclass
class _PsSummarySchema:
    date: int
    qty_long: int
    qty_short: int
    subtype: int
    symbol: int
    cym: int
    exchange: int
    exp_date: int
    pnl: int
    currency: int
    ncols: int


def _build_ps_summary_schema(header: list[str]) -> _PsSummarySchema | None:
    idx = {re.sub(r"\s+", " ", c.lower()): i for i, c in enumerate(header) if c}
    def g(name: str) -> int | None:
        return idx.get(name)

    i_date = g("trade date")
    i_qlong = g("total qty long")
    i_qshort = g("total qty short")
    i_symbol = g("symbol")
    i_pnl = g("gross p&l")

    if any(x is None for x in [i_date, i_qlong, i_qshort, i_symbol, i_pnl]):
        return None

    return _PsSummarySchema(
        date=i_date, qty_long=i_qlong, qty_short=i_qshort,  # type: ignore[arg-type]
        subtype=g("subtype") or 4, symbol=i_symbol,  # type: ignore[arg-type]
        cym=g("contract year month") or 6,  # type: ignore[arg-type]
        exchange=g("exchange") or 7,  # type: ignore[arg-type]
        exp_date=g("exp date") or 8,  # type: ignore[arg-type]
        pnl=i_pnl,  # type: ignore[arg-type]
        currency=g("currency code") or 10,  # type: ignore[arg-type]
        ncols=len(header),
    )


# ── Row parsers ───────────────────────────────────────────────────────────────

def _parse_confirmation_row(
    cells: list[str],
    schema: _ConfirmationsSchema,
) -> list[RawExecution]:
    def g(i: int) -> str:
        return cells[i] if i < len(cells) else ""

    trade_date = _to_date(g(schema.date))
    if trade_date is None:
        return []

    qty_long = _to_decimal(g(schema.qty_long))
    qty_short = _to_decimal(g(schema.qty_short))
    symbol_raw = g(schema.symbol).upper()
    cym = g(schema.cym)
    exchange = g(schema.exchange)
    price = _to_decimal(g(schema.price))
    subtype = g(schema.subtype)

    if not symbol_raw or price is None:
        return []

    symbol = _build_futures_symbol(symbol_raw, cym, exchange)
    asset_class = "event_contract" if exchange.upper() == "KALSHI" or not _clean(cym) else "future"
    executed_at = datetime.combine(trade_date, datetime.min.time())

    result = []
    if qty_long and qty_long > 0:
        result.append(RawExecution(
            executed_at=executed_at, symbol=symbol, side="buy",
            quantity=qty_long, price=price, fees=Decimal("0"),
            asset_class=asset_class,
        ))
    if qty_short and qty_short > 0:
        result.append(RawExecution(
            executed_at=executed_at, symbol=symbol, side="sell",
            quantity=qty_short, price=price, fees=Decimal("0"),
            asset_class=asset_class,
        ))
    return result


def _parse_ps_summary_row(
    cells: list[str],
    schema: _PsSummarySchema,
) -> FuturesPnLSummary | None:
    def g(i: int) -> str:
        return cells[i] if i < len(cells) else ""

    trade_date = _to_date(g(schema.date))
    if trade_date is None:
        return None

    symbol_raw = g(schema.symbol).upper()
    if not symbol_raw:
        return None

    cym = g(schema.cym)
    exchange = g(schema.exchange)
    parsed_cym = _parse_contract_year_month(cym)
    cy, cm = parsed_cym if parsed_cym else (0, 0)
    exp_date = _to_date(g(schema.exp_date)) or trade_date
    gross_pnl = _to_decimal(g(schema.pnl))
    if gross_pnl is None:
        return None

    qty_long = _to_decimal(g(schema.qty_long)) or Decimal("0")
    qty_short = _to_decimal(g(schema.qty_short)) or Decimal("0")
    currency = g(schema.currency) or "USD"
    subtype = g(schema.subtype)

    return FuturesPnLSummary(
        trade_date=trade_date,
        symbol=_build_futures_symbol(symbol_raw, cym, exchange),
        contract_year=cy,
        contract_month=cm,
        exchange=exchange,
        exp_date=exp_date,
        qty_long=qty_long,
        qty_short=qty_short,
        gross_pnl=gross_pnl,
        currency=currency,
        subtype=subtype,
    )


# ── Main parser ───────────────────────────────────────────────────────────────

def parse_rh_futures_pdf(
    path: str | Path,
) -> tuple[list[RawExecution], list[FuturesPnLSummary]]:
    """
    Parse a Robinhood Derivatives futures PDF (daily or monthly).

    Uses a cross-page state machine so that multi-page sections are fully
    captured even when continuation pages have no header row.

    Returns:
        executions:    individual fills ready for the trade matcher
        pnl_summaries: daily P&L aggregates for cross-verification
    """
    executions: list[RawExecution] = []
    pnl_summaries: list[FuturesPnLSummary] = []

    section = _Section.UNKNOWN
    conf_schema: _ConfirmationsSchema | None = None
    ps_schema: _PsSummarySchema | None = None

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables(
                {"vertical_strategy": "lines", "horizontal_strategy": "lines"}
            )
            for table in tables:
                if not table:
                    continue

                for row in table:
                    cells = _row_cells(row)
                    if not any(cells):
                        continue

                    # ── Detect section headers ─────────────────────────────
                    new_section = _detect_section(cells)
                    if new_section is not None:
                        section = new_section
                        if section == _Section.CONFIRMATIONS:
                            conf_schema = _build_confirmations_schema(cells)
                        elif section == _Section.PS_SUMMARY:
                            ps_schema = _build_ps_summary_schema(cells)
                        continue  # header row consumed

                    # ── Detect section terminators ─────────────────────────
                    if _is_section_terminator(cells):
                        section = _Section.UNKNOWN
                        continue

                    # ── Process data rows ──────────────────────────────────
                    if section == _Section.CONFIRMATIONS and conf_schema is not None:
                        executions.extend(_parse_confirmation_row(cells, conf_schema))

                    elif section == _Section.PS_SUMMARY and ps_schema is not None:
                        summary = _parse_ps_summary_row(cells, ps_schema)
                        if summary:
                            pnl_summaries.append(summary)

    executions.sort(key=lambda e: e.executed_at)
    return executions, pnl_summaries
