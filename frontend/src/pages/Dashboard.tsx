import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { analytics } from "@/services/api";
import { useFirstAccount } from "@/hooks/useFirstAccount";
import StatCard from "@/components/ui/StatCard";
import PeriodToggle from "@/components/ui/PeriodToggle";
import DailyPnlChart from "@/components/charts/DailyPnlChart";
import CumulativeChart from "@/components/charts/CumulativeChart";
import HourlyPnlChart from "@/components/charts/HourlyPnlChart";
import SymbolPnlTable from "@/components/charts/SymbolPnlTable";
import type { Period } from "@/types";

function formatHoldTime(mins: number | null): string {
  if (mins == null) return "—";
  if (mins < 60) return `${Math.round(mins)}m`;
  if (mins < 1440) {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(mins / 1440);
  const h = Math.round((mins % 1440) / 60);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

function fmt(v: number) {
  return `${v >= 0 ? "+" : ""}$${Math.abs(v).toFixed(2)}`;
}

function streakLabel(type: "win" | "loss" | null, count: number): string {
  if (!type) return "—";
  return `${count} ${type === "win" ? "W" : "L"}`;
}

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("all");
  const { accountId, isLoading: accountLoading } = useFirstAccount();

  const enabled = !!accountId;
  const queryOpts = { enabled };

  const { data: summary } = useQuery({
    queryKey: ["summary", accountId, period],
    queryFn: () => analytics.summary(accountId!, period),
    ...queryOpts,
  });

  const { data: daily = [] } = useQuery({
    queryKey: ["pnl-daily", accountId],
    queryFn: () => analytics.pnlDaily(accountId!, 90),
    ...queryOpts,
  });

  const { data: hourly = [] } = useQuery({
    queryKey: ["pnl-by-hour", accountId, period],
    queryFn: () => analytics.pnlByHour(accountId!, period),
    ...queryOpts,
  });

  const { data: bySymbol = [] } = useQuery({
    queryKey: ["pnl-by-symbol", accountId, period],
    queryFn: () => analytics.pnlBySymbol(accountId!, period),
    ...queryOpts,
  });

  const { data: cumulative = [] } = useQuery({
    queryKey: ["pnl-cumulative", accountId, period],
    queryFn: () => analytics.pnlCumulative(accountId!, period),
    ...queryOpts,
  });

  if (accountLoading) {
    return <div className="text-gray-400 py-12 text-center">Loading…</div>;
  }

  if (!accountId) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-gray-500">No accounts yet.</p>
        <Link to="/settings" className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
          Create an account
        </Link>
      </div>
    );
  }

  const noTrades = summary?.total_trades === 0;

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      {noTrades ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-gray-500">No closed trades for this period.</p>
          <Link to="/import" className="inline-block text-blue-600 text-sm hover:underline">
            Import a statement →
          </Link>
        </div>
      ) : (
        <>
          {/* Primary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Net P&L" value={summary ? fmt(summary.total_pnl) : "—"} colorize />
            <StatCard label="Win Rate" value={summary ? `${summary.win_rate}%` : "—"} />
            <StatCard label="Profit Factor" value={summary?.profit_factor ?? "—"} />
            <StatCard label="Total Trades" value={summary?.total_trades ?? "—"} />
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Avg Winner" value={summary ? `+$${summary.avg_winner.toFixed(2)}` : "—"} colorize />
            <StatCard label="Avg Loser" value={summary ? `$${summary.avg_loser.toFixed(2)}` : "—"} colorize />
            <StatCard label="Max Drawdown" value={summary ? `-$${summary.max_drawdown.toFixed(2)}` : "—"} colorize />
            <StatCard label="Expectancy" value={summary ? fmt(summary.expectancy) : "—"} colorize />
          </div>

          {/* Streak stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Current Streak"
              value={summary ? streakLabel(summary.current_streak.type, summary.current_streak.count) : "—"}
            />
            <StatCard label="Best Win Streak" value={summary?.max_win_streak ?? "—"} />
            <StatCard label="Worst Loss Streak" value={summary?.max_loss_streak ?? "—"} />
          </div>

          {/* Extra stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Largest Win" value={summary ? `+$${summary.largest_win.toFixed(2)}` : "—"} colorize />
            <StatCard label="Largest Loss" value={summary ? `$${summary.largest_loss.toFixed(2)}` : "—"} colorize />
            <StatCard label="Avg Hold Time" value={formatHoldTime(summary?.avg_hold_minutes ?? null)} />
            <StatCard
              label="Gross P&L"
              value={summary ? `$${summary.gross_profit.toFixed(0)} / -$${summary.gross_loss.toFixed(0)}` : "—"}
            />
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-sm font-medium text-gray-600 mb-3">Daily P&L (last 90 days)</h2>
              {daily.length > 0 ? <DailyPnlChart data={daily} /> : <p className="text-sm text-gray-400 py-16 text-center">No data</p>}
            </div>
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-sm font-medium text-gray-600 mb-3">Cumulative P&L</h2>
              {cumulative.length > 0 ? <CumulativeChart data={cumulative} /> : <p className="text-sm text-gray-400 py-16 text-center">No data</p>}
            </div>
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-sm font-medium text-gray-600 mb-3">P&L by Hour of Day</h2>
              {hourly.length > 0 ? <HourlyPnlChart data={hourly} /> : <p className="text-sm text-gray-400 py-16 text-center">No data</p>}
            </div>
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-sm font-medium text-gray-600 mb-3">P&L by Symbol</h2>
              <SymbolPnlTable data={bySymbol} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
