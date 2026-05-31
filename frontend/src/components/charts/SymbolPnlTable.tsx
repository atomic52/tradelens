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
          <tr className="text-left border-b">
            <th className="pb-2 text-xs font-medium text-gray-500 uppercase">Symbol</th>
            <th className="pb-2 text-xs font-medium text-gray-500 uppercase text-right">P&L</th>
            <th className="pb-2 text-xs font-medium text-gray-500 uppercase text-right">Trades</th>
            <th className="pb-2 text-xs font-medium text-gray-500 uppercase text-right">Win %</th>
            <th className="pb-2 text-xs font-medium text-gray-500 uppercase text-right">Avg</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map((row) => (
            <tr key={row.symbol} className="hover:bg-gray-50">
              <td className="py-2 font-mono text-xs font-medium text-gray-800">{row.symbol}</td>
              <td className={clsx("py-2 text-right tabular-nums font-medium", row.pnl >= 0 ? "text-green-600" : "text-red-600")}>
                {fmt(row.pnl)}
              </td>
              <td className="py-2 text-right text-gray-600">{row.trade_count}</td>
              <td className="py-2 text-right text-gray-600">{row.win_rate.toFixed(1)}%</td>
              <td className={clsx("py-2 text-right tabular-nums", row.avg_pnl >= 0 ? "text-green-600" : "text-red-600")}>
                {fmt(row.avg_pnl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p className="text-center text-gray-400 py-8 text-sm">No data for this period</p>
      )}
    </div>
  );
}
