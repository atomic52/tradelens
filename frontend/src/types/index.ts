export type Period = "today" | "week" | "month" | "ytd" | "all";

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  subscription_status: "free" | "pro" | "canceled";
}

export interface Account {
  id: string;
  name: string;
  broker: string;
  created_at: string;
}

export interface Trade {
  id: string;
  account_id: string;
  symbol: string;
  asset_class: string;
  direction: "long" | "short";
  opened_at: string;
  closed_at: string | null;
  status: "open" | "closed";
  quantity: number;
  avg_entry: number;
  avg_exit: number | null;
  realized_pnl: number | null;
  fees: number;
  contract_multiplier: number;
  notes: string | null;
  tags: string | null;
}

export interface AnalyticsSummary {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_pnl: number;
  gross_profit: number;
  gross_loss: number;
  profit_factor: number | null;
  avg_winner: number;
  avg_loser: number;
  expectancy: number;
  max_drawdown: number;
  largest_win: number;
  largest_loss: number;
  avg_hold_minutes: number | null;
  current_streak: { type: "win" | "loss" | null; count: number };
  max_win_streak: number;
  max_loss_streak: number;
}

export interface PnlDailyPoint {
  date: string;
  pnl: number;
  trade_count: number;
  cumulative_pnl: number;
}

export interface PnlHourPoint {
  hour: number;
  pnl: number;
  trade_count: number;
  win_rate: number;
}

export interface PnlSymbolPoint {
  symbol: string;
  pnl: number;
  trade_count: number;
  win_rate: number;
  avg_pnl: number;
}

export interface ImportResult {
  trades_imported: number;
  executions_imported: number;
  file_hash: string;
}

export interface ImportUsage {
  used: number;
  limit: number | null;
  plan: "free" | "pro";
}
