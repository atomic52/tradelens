"""
FIFO trade matching: groups executions into round-trip trades.
Supports long and short trades, partial fills, and open positions.
"""

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal

from app.parsers.robinhood import RawExecution


@dataclass
class MatchedTrade:
    symbol: str
    asset_class: str
    direction: str          # "long" | "short"
    opened_at: datetime
    closed_at: datetime | None
    status: str             # "open" | "closed"
    quantity: Decimal
    avg_entry: Decimal
    avg_exit: Decimal | None
    realized_pnl: Decimal | None
    fees: Decimal
    multiplier: Decimal = Decimal("1")
    executions: list[RawExecution] = field(default_factory=list)


@dataclass
class _OpenPosition:
    direction: str
    entries: list[tuple[Decimal, Decimal, datetime, RawExecution]]  # (qty, price, time, exec)
    fees: Decimal = Decimal("0")


def match_trades(
    executions: list[RawExecution],
    multiplier: Decimal = Decimal("1"),
) -> list[MatchedTrade]:
    """
    Group raw executions into matched round-trip trades using FIFO.

    multiplier: contract multiplier for dollar P&L calculation
      - equity/event_contract: 1
      - option: 100
      - futures: symbol-specific (e.g. ES=50, NQ=20, SI=5000)
    """
    positions: dict[str, _OpenPosition] = {}
    completed: list[MatchedTrade] = []

    for ex in executions:
        key = ex.symbol

        if key not in positions:
            direction = "long" if ex.side == "buy" else "short"
            positions[key] = _OpenPosition(
                direction=direction,
                entries=[(ex.quantity, ex.price, ex.executed_at, ex)],
                fees=ex.fees,
            )
            continue

        pos = positions[key]
        opening_side = "buy" if pos.direction == "long" else "sell"

        if ex.side == opening_side:
            pos.entries.append((ex.quantity, ex.price, ex.executed_at, ex))
            pos.fees += ex.fees
        else:
            # Closing (partially or fully)
            remaining_close = ex.quantity
            closed_entries: list[tuple[Decimal, Decimal, datetime, RawExecution]] = []

            while remaining_close > 0 and pos.entries:
                entry_qty, entry_price, entry_time, entry_ex = pos.entries[0]

                if entry_qty <= remaining_close:
                    closed_entries.append(pos.entries.pop(0))
                    remaining_close -= entry_qty
                else:
                    closed_entries.append((remaining_close, entry_price, entry_time, entry_ex))
                    pos.entries[0] = (entry_qty - remaining_close, entry_price, entry_time, entry_ex)
                    remaining_close = Decimal("0")

            if closed_entries:
                total_entry_qty = sum(e[0] for e in closed_entries)
                avg_entry = sum(e[0] * e[1] for e in closed_entries) / total_entry_qty
                avg_exit = ex.price
                close_fees = ex.fees
                # FIXME: entry_fees proportional allocation not yet used in pnl

                if pos.direction == "long":
                    pnl = (avg_exit - avg_entry) * total_entry_qty * multiplier - close_fees
                else:
                    pnl = (avg_entry - avg_exit) * total_entry_qty * multiplier - close_fees

                completed.append(
                    MatchedTrade(
                        symbol=key,
                        asset_class=ex.asset_class,
                        direction=pos.direction,
                        opened_at=closed_entries[0][2],
                        closed_at=ex.executed_at,
                        status="closed",
                        quantity=total_entry_qty,
                        avg_entry=avg_entry,
                        avg_exit=avg_exit,
                        realized_pnl=pnl,
                        fees=close_fees,
                        multiplier=multiplier,
                        executions=[e[3] for e in closed_entries] + [ex],
                    )
                )

            if not pos.entries:
                del positions[key]
            else:
                pos.fees = ex.fees

    # Remaining open positions
    for key, pos in positions.items():
        total_qty = sum(e[0] for e in pos.entries)
        avg_entry = sum(e[0] * e[1] for e in pos.entries) / total_qty
        completed.append(
            MatchedTrade(
                symbol=key,
                asset_class=pos.entries[0][3].asset_class,
                direction=pos.direction,
                opened_at=pos.entries[0][2],
                closed_at=None,
                status="open",
                quantity=total_qty,
                avg_entry=avg_entry,
                avg_exit=None,
                realized_pnl=None,
                fees=pos.fees,
                multiplier=multiplier,
                executions=[e[3] for e in pos.entries],
            )
        )

    return sorted(completed, key=lambda t: t.opened_at)
