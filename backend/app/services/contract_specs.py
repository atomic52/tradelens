"""
Futures contract multipliers (dollar value per 1 point move, per contract).

Used to convert price-difference P&L into dollar P&L:
  realized_pnl = (avg_exit - avg_entry) * qty * multiplier
"""

import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

_MULTIPLIERS: dict[str, Decimal] = {
    # Equity index futures (CME)
    "ES": Decimal("50"),      # E-mini S&P 500
    "MES": Decimal("5"),      # Micro E-mini S&P 500
    "NQ": Decimal("20"),      # E-mini Nasdaq-100
    "MNQ": Decimal("2"),      # Micro E-mini Nasdaq-100
    "RTY": Decimal("50"),     # E-mini Russell 2000
    "M2K": Decimal("5"),      # Micro E-mini Russell 2000
    "YM": Decimal("5"),       # E-mini Dow Jones
    "MYM": Decimal("0.5"),    # Micro E-mini Dow Jones
    # Metals (COMEX)
    "GC": Decimal("100"),     # Gold (100 troy oz)
    "MGC": Decimal("10"),     # Micro Gold (10 troy oz)
    "SI": Decimal("5000"),    # Silver (5000 troy oz)
    "MSI": Decimal("1000"),   # Micro Silver
    "HG": Decimal("25000"),   # Copper (25,000 lbs)
    "PL": Decimal("50"),      # Platinum (50 troy oz)
    # Energy (NYMEX)
    "CL": Decimal("1000"),    # WTI Crude Oil (1000 bbl)
    "MCL": Decimal("100"),    # Micro WTI Crude Oil
    "NG": Decimal("10000"),   # Natural Gas (10,000 MMBtu)
    "RB": Decimal("42000"),   # RBOB Gasoline
    "HO": Decimal("42000"),   # Heating Oil
    # Rates (CBOT)
    "ZB": Decimal("1000"),    # 30yr T-Bond
    "ZN": Decimal("1000"),    # 10yr T-Note
    "ZF": Decimal("1000"),    # 5yr T-Note
    "ZT": Decimal("2000"),    # 2yr T-Note
    # Currencies (CME)
    "6E": Decimal("125000"),  # Euro FX
    "6J": Decimal("12500000"), # Japanese Yen
    "6B": Decimal("62500"),   # British Pound
    "6A": Decimal("100000"),  # Australian Dollar
    "6C": Decimal("100000"),  # Canadian Dollar
    # Grains (CBOT)
    "ZC": Decimal("50"),      # Corn
    "ZS": Decimal("50"),      # Soybeans
    "ZW": Decimal("50"),      # Wheat
    # Livestock (CME)
    "LE": Decimal("400"),     # Live Cattle
    "HE": Decimal("400"),     # Lean Hogs
}


def get_multiplier(symbol: str, asset_class: str) -> Decimal:
    """
    Return the contract multiplier for computing dollar P&L.

    Options:         100 (1 contract = 100 shares)
    Equity/crypto:   1
    Event contracts: 1 (already dollar-denominated)
    Futures:         lookup by root symbol, default 1 with warning
    """
    if asset_class == "option":
        return Decimal("100")
    if asset_class in ("equity", "crypto", "event_contract"):
        return Decimal("1")

    # Futures: strip canonical suffix "ES_2025_12" → "ES"
    root = symbol.split("_")[0].upper()
    mult = _MULTIPLIERS.get(root)
    if mult is None:
        logger.warning("Unknown futures root '%s' (from '%s') — defaulting multiplier to 1", root, symbol)
        return Decimal("1")
    return mult
