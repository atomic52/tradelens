"""
Parser for Robinhood CSV export.

Download from: Robinhood app → Account → Statements & History → Export CSV
Expected columns: Activity Date, Process Date, Settle Date, Instrument, Description,
                  Trans Code, Quantity, Price, Amount
"""

import csv
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from io import StringIO


@dataclass
class RawExecution:
    executed_at: datetime
    symbol: str
    side: str          # "buy" | "sell"
    quantity: Decimal
    price: Decimal
    fees: Decimal
    asset_class: str   # "equity" | "option" | "crypto"


_TRANS_CODE_MAP = {
    "Buy": ("buy", "equity"),
    "Sell": ("sell", "equity"),
    "BCXL": ("buy", "option"),   # buy to open / buy to close
    "SCXL": ("sell", "option"),  # sell to open / sell to close
    "STO": ("sell", "option"),
    "BTO": ("buy", "option"),
    "STC": ("sell", "option"),
    "BTC": ("buy", "option"),
}


def parse_robinhood_csv(content: str) -> list[RawExecution]:
    reader = csv.DictReader(StringIO(content))
    # Normalize column names (strip whitespace)
    reader.fieldnames = [f.strip() for f in (reader.fieldnames or [])]

    executions: list[RawExecution] = []

    for row in reader:
        trans_code = row.get("Trans Code", "").strip()
        if trans_code not in _TRANS_CODE_MAP:
            continue

        side, asset_class = _TRANS_CODE_MAP[trans_code]

        try:
            executed_at = datetime.strptime(row["Activity Date"].strip(), "%m/%d/%Y")
            symbol = row["Instrument"].strip().upper()
            quantity = Decimal(str(row["Quantity"]).strip()).copy_abs()
            price_raw = row["Price"].replace("$", "").replace(",", "").strip()
            price = Decimal(price_raw) if price_raw else Decimal("0")
            fees = Decimal("0")
        except (KeyError, ValueError):
            continue

        executions.append(
            RawExecution(
                executed_at=executed_at,
                symbol=symbol,
                side=side,
                quantity=quantity,
                price=price,
                fees=fees,
                asset_class=asset_class,
            )
        )

    executions.sort(key=lambda e: e.executed_at)
    return executions
