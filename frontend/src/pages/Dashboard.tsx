import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { analytics, billing as billingApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useFirstAccount } from "@/hooks/useFirstAccount";
import StatCard from "@/components/ui/StatCard";
import PeriodToggle from "@/components/ui/PeriodToggle";
import DailyPnlChart from "@/components/charts/DailyPnlChart";
import CumulativeChart from "@/components/charts/CumulativeChart";
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

function fmt(v: number, decimals = 2) {
  return `${v >= 0 ? "+" : ""}$${Math.abs(v).toFixed(decimals)}`;
}

function fmtK(v: number) {
  if (Math.abs(v) >= 1000) {
    return `${v >= 0 ? "+" : "-"}$${(Math.abs(v) / 1000).toFixed(1)}k`;
  }
  return fmt(v, 0);
}

function streakLabel(type: "win" | "loss" | null, count: number): string {
  if (!type) return "—";
  return `${count} ${type === "win" ? "W" : "L"}`;
}

// Map period to approximate days for the daily chart
const PERIOD_DAYS: Record<Period, number> = {
  today: 1,
  week: 7,
  month: 31,
  ytd: 365,
  all: 365 * 10,
};

const DISMISS_KEY = "pro_banner_dismissed";

function ProBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");
  const [loading, setLoading] = useState(false);

  if (user?.subscription_status === "pro" || dismissed) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { url } = await billingApi.createCheckout();
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="relative rounded-xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">Upgrade to TradeLens Pro</p>
          <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">
            Unlimited uploads, all statement types, full history. <span className="font-medium">$20/month.</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? "Redirecting…" : "Upgrade — $20/mo"}
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="w-7 h-7 flex items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
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
    queryKey: ["pnl-daily", accountId, period],
    queryFn: () => analytics.pnlDaily(accountId!, PERIOD_DAYS[period]),
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
    return <div className="text-slate-400 dark:text-slate-500 py-12 text-center">Loading...</div>;
  }

  if (!accountId) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-slate-500 dark:text-slate-400">No accounts yet.</p>
        <Link to="/settings" className="inline-block bg-brand-500 text-white px-4 py-2 rounded text-sm hover:bg-brand-600">
          Create an account
        </Link>
      </div>
    );
  }

  const noTrades = summary?.total_trades === 0;
  const s = summary;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Dashboard</h1>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      <ProBanner />

      {noTrades ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-slate-500 dark:text-slate-400 text-sm">No closed trades for this period.</p>
          <Link to="/import" className="inline-block text-brand-600 text-sm hover:underline">
            Upload a statement →
          </Link>
        </div>
      ) : (
        <>
          {/* Hero row — Net P&L + key ratios */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 md:col-span-1">
              <StatCard
                label="Net P&L"
                value={s ? fmt(s.total_pnl) : "—"}
                sub={s ? `${s.total_trades} trades` : undefined}
                colorize
                size="large"
                accent
              />
            </div>
            <StatCard
              label="Win Rate"
              value={s ? `${s.win_rate}%` : "—"}
              sub={s ? `${s.winning_trades}W / ${s.losing_trades}L` : undefined}
            />
            <StatCard
              label="Profit Factor"
              value={s?.profit_factor ?? "—"}
              sub={s ? `Exp. ${fmt(s.expectancy, 0)}/trade` : undefined}
            />
            <StatCard
              label="Avg Hold Time"
              value={formatHoldTime(s?.avg_hold_minutes ?? null)}
              sub={s ? `Max dd ${fmtK(-s.max_drawdown)}` : undefined}
            />
          </div>

          {/* Secondary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Avg Winner"
              value={s ? `+$${s.avg_winner.toFixed(0)}` : "—"}
              sub={s ? `Best: +$${s.largest_win.toFixed(0)}` : undefined}
              colorize
            />
            <StatCard
              label="Avg Loser"
              value={s ? `-$${Math.abs(s.avg_loser).toFixed(0)}` : "—"}
              sub={s ? `Worst: -$${Math.abs(s.largest_loss).toFixed(0)}` : undefined}
              colorize
            />
            <StatCard
              label="Gross Profit"
              value={s ? `$${s.gross_profit.toFixed(0)}` : "—"}
            />
            <StatCard
              label="Gross Loss"
              value={s ? `-$${s.gross_loss.toFixed(0)}` : "—"}
              colorize
            />
          </div>

          {/* Streak row */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Current Streak"
              value={s ? streakLabel(s.current_streak.type, s.current_streak.count) : "—"}
              colorize={s?.current_streak.type === "win"}
            />
            <StatCard label="Best Win Streak" value={s?.max_win_streak ?? "—"} sub="consecutive wins" />
            <StatCard label="Worst Loss Streak" value={s?.max_loss_streak ?? "—"} sub="consecutive losses" />
          </div>

          {/* Charts: top row = Daily + Symbol; bottom row = Cumulative full width */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Daily P&L</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {daily.length > 0 ? `${daily.length} trading days` : ""}
                </span>
              </div>
              {daily.length > 0
                ? <DailyPnlChart data={daily} />
                : <p className="text-sm text-slate-400 py-16 text-center">No data for this period</p>}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">P&L by Symbol</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500">{bySymbol.length} symbols</span>
              </div>
              <SymbolPnlTable data={bySymbol} />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cumulative P&L</h2>
                {cumulative.length > 0 && s && (
                  <span className={`text-xs font-semibold tabular-nums ${s.total_pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                    {fmt(s.total_pnl)}
                  </span>
                )}
              </div>
              {cumulative.length > 0
                ? <CumulativeChart data={cumulative} />
                : <p className="text-sm text-slate-400 py-16 text-center">No data for this period</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
