"""
Parser for Robinhood CSV export.

Download from: Robinhood app → Account → Statements & History → Export CSV
Expected columns: Activity Date, Process Date, Settle Date, Instrument, Description,
                  Trans Code, Quantity, Price, Amount
"""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from io import StringIO

import pandas as pd


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
    df = pd.read_csv(StringIO(content))
    df.columns = df.columns.str.strip()

    executions: list[RawExecution] = []

    for _, row in df.iterrows():
        trans_code = str(row.get("Trans Code", "")).strip()
        if trans_code not in _TRANS_CODE_MAP:
            continue

        side, asset_class = _TRANS_CODE_MAP[trans_code]

        try:
            executed_at = pd.to_datetime(row["Activity Date"]).to_pydatetime()
            symbol = str(row["Instrument"]).strip().upper()
            quantity = Decimal(str(row["Quantity"])).copy_abs()
            price_raw = str(row["Price"]).replace("$", "").replace(",", "").strip()
            price = Decimal(price_raw) if price_raw else Decimal("0")
            fees = Decimal("0")  # Robinhood doesn't charge commissions; adjust if needed
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

    # Sort oldest-first so trade matching works correctly
    executions.sort(key=lambda e: e.executed_at)
    return executions
