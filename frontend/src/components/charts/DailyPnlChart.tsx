import { format, parseISO } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@/contexts/ThemeContext";
import type { PnlDailyPoint } from "@/types";

interface Props {
  data: PnlDailyPoint[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: PnlDailyPoint }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg px-3 py-2 text-xs space-y-0.5">
      <p className="font-medium text-slate-700 dark:text-slate-300">{label}</p>
      <p className={d.pnl >= 0 ? "text-green-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
        P&L: ${d.pnl.toFixed(2)}
      </p>
      <p className="text-slate-500">{d.trade_count} trade{d.trade_count !== 1 ? "s" : ""}</p>
    </div>
  );
}

export default function DailyPnlChart({ data }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const formatted = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "MMM d"),
  }));

  const gridColor = isDark ? "#1e293b" : "#f0f0f0";
  const tickColor = isDark ? "#94a3b8" : "#6b7280";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={52} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
          {formatted.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
