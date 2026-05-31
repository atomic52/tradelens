import { clsx } from "clsx";
import type { PnlSymbolPoint } from "@/types";

interface Props {
  data: PnlSymbolPoint[];
}

function fmt(v: number) {
  return `${v >= 0 ? "+" : ""}$${v.toFixed(2)}`;
}

export default function SymbolPnlTable({ data }: Props) {
  const sorted = [...data].sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b dark:border-slate-700">
            <th className="pb-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Symbol</th>
            <th className="pb-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase text-right">P&L</th>
            <th className="pb-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase text-right">Trades</th>
            <th className="pb-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase text-right">Win %</th>
            <th className="pb-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase text-right">Avg</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
          {sorted.map((row) => (
            <tr key={row.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="py-2 font-mono text-xs font-medium text-slate-800 dark:text-slate-200">{row.symbol}</td>
              <td className={clsx("py-2 text-right tabular-nums font-medium", row.pnl >= 0 ? "text-green-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                {fmt(row.pnl)}
              </td>
              <td className="py-2 text-right text-slate-600 dark:text-slate-400">{row.trade_count}</td>
              <td className="py-2 text-right text-slate-600 dark:text-slate-400">{row.win_rate.toFixed(1)}%</td>
              <td className={clsx("py-2 text-right tabular-nums", row.avg_pnl >= 0 ? "text-green-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                {fmt(row.avg_pnl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p className="text-center text-slate-400 py-8 text-sm">No data for this period</p>
      )}
    </div>
  );
}
