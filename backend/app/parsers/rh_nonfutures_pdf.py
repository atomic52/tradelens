"""
Parser for Robinhood Securities/Financial non-futures monthly PDF statements.

Source section: "Account Activity" (may repeat across multiple pages)
Columns: Description | Symbol | Acct Type | Transaction | Date | Qty | Price | Debit | Credit

Key layout notes:
- The "Description" text is split across several cells by pdfplumber text extraction.
  All cells before the "Symbol" column position are joined as the description.
- The last 6 columns are always: Transaction | Date | Qty | Price | Debit | Credit
  with Symbol and Acct Type just before them.

Transaction codes kept:
  BTO  - Buy to Open  (option)
  STC  - Sell to Close (option)
  Buy  - Stock/ETF purchase
  Sell - Stock/ETF sale

Everything else (FUTSWP, CDIV, GMPC, ACH, ...) is skipped.

Option description format: "<SYMBOL> MM/DD/YYYY <Put|Call> $<STRIKE>"
  e.g. "SPX 04/17/2026 Put $6,815.00"
Canonical option symbol: SPX_20260417_P6815
"""

import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

import pdfplumber

from app.parsers.robinhood import RawExecution

_TRADE_TRANSACTIONS = frozenset({"BTO", "STC", "Buy", "Sell"})
_SKIP_TRANSACTIONS = frozenset({"FUTSWP", "CDIV", "GMPC", "ACH", "CDIVR"})

_DATE_RE = re.compile(r"^\d{2}/\d{2}/\d{4}$")
_ACCOUNT_ACTIVITY_RE = re.compile(r"Account\s+Activity", re.IGNORECASE)
_STOP_RE = re.compile(
    r"Total\s+Funds\s+Paid|Executed\s+Trades\s+Pending|Stock\s+Lending",
    re.IGNORECASE,
)

_OPTION_DESC_RE = re.compile(
    r"^(?P<underlying>[A-Z]+\w*)\s+"
    r"(?P<exp_date>\d{2}/\d{2}/\d{4})\s+"
    r"(?P<opt_type>Put|Call)\s+"
    r"\$?(?P<strike>[\d,]+(?:\.\d+)?)$",
    re.IGNORECASE,
)


def _clean(v: str | None) -> str:
    return (v or "").strip()


def _parse_money(v: str | None) -> Decimal | None:
    s = _clean(v).lstrip("$").replace(",", "")
    try:
        return Decimal(s) if s else None
    except InvalidOperation:
        return None


def _parse_qty(v: str | None) -> Decimal | None:
    s = _clean(v).replace(",", "")
    try:
        d = Decimal(s)
        return d if d > 0 else None
    except InvalidOperation:
        return None


def _parse_date(v: str | None) -> datetime | None:
    s = _clean(v)
    if _DATE_RE.match(s):
        try:
            return datetime.strptime(s, "%m/%d/%Y")
        except ValueError:
            pass
    return None


_SPLIT_NUM_RE = re.compile(r"^[\$\d,]+$")  # looks like a partial number: "$6,8" or "6,8"
_CONT_NUM_RE = re.compile(r"^\d")           # continuation starts with digit: "15.00"


def _join_desc_cells(cells: list[str]) -> str:
    """
    Join description cells, merging split numbers without a space.
    e.g. ["SPX 04/17/2026 Put", "$6,8", "15.00"] → "SPX 04/17/2026 Put $6,815.00"
    """
    if not cells:
        return ""
    result = cells[0]
    for cell in cells[1:]:
        # If previous token looks like a partial number and this cell continues it, no space
        prev = result.rsplit(" ", 1)[-1] if " " in result else result
        if _SPLIT_NUM_RE.match(prev) and _CONT_NUM_RE.match(cell):
            result += cell
        else:
            result += " " + cell
    return result.strip()


def _build_option_symbol(underlying: str, exp_date: str, opt_type: str, strike: str) -> str:
    """
    SPX + 04/17/2026 + Put + 6815.00 → SPX_20260417_P6815
    """
    dt = datetime.strptime(exp_date, "%m/%d/%Y")
    t = "P" if opt_type.lower() == "put" else "C"
    strike_clean = strike.replace(",", "")
    try:
        d = Decimal(strike_clean)
        strike_str = str(int(d)) if d == d.to_integral_value() else strike_clean
    except InvalidOperation:
        strike_str = strike_clean
    return f"{underlying}_{dt.strftime('%Y%m%d')}_{t}{strike_str}"


def _find_header_indices(header_row: list[str]) -> dict[str, int] | None:
    """
    Locate the fixed trailing columns in the header row.
    Returns a dict mapping column name → cell index, or None if header not found.
    """
    cells = [_clean(c).lower() for c in header_row]
    # The fixed columns at the end are: transaction | date | qty | price | debit | credit
    # Find "transaction" as the anchor
    for i, c in enumerate(cells):
        if c == "transaction":
            # Expect: symbol at i-2, acct type at i-1, transaction at i
            # then date, qty, price, debit, credit follow
            return {
                "symbol": i - 2 if i >= 2 else None,
                "acct_type": i - 1 if i >= 1 else None,
                "transaction": i,
                "date": i + 1,
                "qty": i + 2,
                "price": i + 3,
                "debit": i + 4,
                "credit": i + 5,
                "desc_end": i - 2,  # cells[0:desc_end] joined = description
            }
    return None


def _parse_activity_table(
    table: list[list[str | None]],
) -> list[RawExecution]:
    """Parse one Account Activity table, returning executions."""
    if not table:
        return []

    # Find the header row
    col_idx: dict[str, int] | None = None
    data_start = 0
    for row_i, row in enumerate(table):
        cells = [_clean(c) for c in row]
        candidate = _find_header_indices(cells)
        if candidate:
            col_idx = candidate
            data_start = row_i + 1
            break

    if col_idx is None:
        return []

    i_sym = col_idx.get("symbol")
    i_trans = col_idx["transaction"]
    i_date = col_idx["date"]
    i_qty = col_idx["qty"]
    i_price = col_idx["price"]
    i_debit = col_idx["debit"]
    i_credit = col_idx["credit"]
    desc_end = col_idx.get("desc_end", i_trans)

    executions: list[RawExecution] = []

    for row in table[data_start:]:
        cells = [_clean(c) for c in row]
        row_text = " ".join(cells)

        if _STOP_RE.search(row_text):
            break

        # Skip blank rows
        if not any(cells):
            continue

        # Safely get values
        def get(idx: int | None) -> str:
            if idx is None or idx >= len(cells):
                return ""
            return cells[idx]

        transaction = get(i_trans)

        # Skip non-trade rows
        if not transaction:
            continue
        if transaction in _SKIP_TRANSACTIONS:
            continue
        if transaction not in _TRADE_TRANSACTIONS:
            continue

        parsed_date = _parse_date(get(i_date))
        if parsed_date is None:
            continue

        qty = _parse_qty(get(i_qty))
        price = _parse_money(get(i_price))
        if qty is None or price is None:
            continue

        debit = _parse_money(get(i_debit))
        credit = _parse_money(get(i_credit))

        # Reconstruct description from all cells before symbol position.
        # pdfplumber may split a number like "$6,815.00" into "$6,8" + "15.00".
        # Detect that and merge without a space.
        desc_cells = [c for c in (cells[:desc_end] if desc_end else []) if c]
        description = _join_desc_cells(desc_cells)

        symbol_raw = get(i_sym).upper()

        # Determine asset class from transaction code
        if transaction in ("BTO", "STC"):
            asset_class = "option"
            side = "buy" if transaction == "BTO" else "sell"
        else:
            asset_class = "equity"
            side = "buy" if transaction == "Buy" else "sell"

        # Build canonical symbol
        if asset_class == "option":
            m = _OPTION_DESC_RE.match(description)
            if m:
                symbol = _build_option_symbol(
                    m.group("underlying"),
                    m.group("exp_date"),
                    m.group("opt_type"),
                    m.group("strike"),
                )
            else:
                symbol = symbol_raw or description.split()[0].upper()
        else:
            symbol = symbol_raw

        if not symbol:
            continue

        # Compute fees
        notional = qty * price * (100 if asset_class == "option" else 1)
        if side == "buy" and debit is not None:
            fees = max(debit - notional, Decimal("0"))
        elif side == "sell" and credit is not None:
            fees = max(notional - credit, Decimal("0"))
        else:
            fees = Decimal("0")

        executions.append(RawExecution(
            executed_at=parsed_date,
            symbol=symbol,
            side=side,
            quantity=qty,
            price=price,
            fees=fees,
            asset_class=asset_class,
        ))

    return executions


def parse_rh_nonfutures_pdf(path: str | Path) -> list[RawExecution]:
    """
    Parse a Robinhood Securities non-futures monthly PDF statement.

    Returns executions for stocks and equity options only.
    Futures inter-entity transfers (FUTSWP) are excluded.
    """
    executions: list[RawExecution] = []

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            if not _ACCOUNT_ACTIVITY_RE.search(text):
                continue

            table = page.extract_table(
                {
                    "vertical_strategy": "text",
                    "horizontal_strategy": "text",
                    "snap_tolerance": 3,
                    "join_tolerance": 3,
                    "min_words_vertical": 2,
                }
            )
            if table:
                executions.extend(_parse_activity_table(table))

    executions.sort(key=lambda e: e.executed_at)
    return executions
