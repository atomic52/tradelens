import { format, parseISO, startOfMonth, startOfWeek } from "date-fns";
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

// Thresholds for auto-downsampling
const WEEKLY_THRESHOLD = 60;   // >60 daily bars → group by week
const MONTHLY_THRESHOLD = 200; // >200 daily bars → group by month

type Granularity = "daily" | "weekly" | "monthly";

interface GroupedPoint {
  date: string;
  label: string;
  pnl: number;
  trade_count: number;
  cumulative_pnl: number;
}

function granularity(count: number): Granularity {
  if (count > MONTHLY_THRESHOLD) return "monthly";
  if (count > WEEKLY_THRESHOLD) return "weekly";
  return "daily";
}

function groupData(data: PnlDailyPoint[], gran: Granularity): GroupedPoint[] {
  if (gran === "daily") {
    return data.map((d) => ({
      ...d,
      label: format(parseISO(d.date), "MMM d"),
    }));
  }

  // Build a map keyed by bucket start date
  const buckets = new Map<string, { pnl: number; trade_count: number; last_cumulative: number }>();
  const bucketOrder: string[] = [];

  for (const d of data) {
    const parsed = parseISO(d.date);
    const bucketDate =
      gran === "weekly"
        ? startOfWeek(parsed, { weekStartsOn: 1 }) // Mon-start week
        : startOfMonth(parsed);
    const key = format(bucketDate, "yyyy-MM-dd");

    if (!buckets.has(key)) {
      buckets.set(key, { pnl: 0, trade_count: 0, last_cumulative: 0 });
      bucketOrder.push(key);
    }
    const b = buckets.get(key)!;
    b.pnl += d.pnl;
    b.trade_count += d.trade_count;
    b.last_cumulative = d.cumulative_pnl; // last day in bucket = end-of-period cumulative
  }

  return bucketOrder.map((key) => {
    const b = buckets.get(key)!;
    const label =
      gran === "weekly"
        ? `w/c ${format(parseISO(key), "MMM d")}`
        : format(parseISO(key), "MMM ''yy");
    return {
      date: key,
      label,
      pnl: b.pnl,
      trade_count: b.trade_count,
      cumulative_pnl: b.last_cumulative,
    };
  });
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: GroupedPoint }[];
  label?: string;
  gran: Granularity;
}

function CustomTooltip({ active, payload, label, gran }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const periodLabel =
    gran === "monthly" ? "Month" : gran === "weekly" ? "Week" : "Day";
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg px-3 py-2 text-xs space-y-0.5">
      <p className="font-medium text-slate-700 dark:text-slate-300">{label}</p>
      <p className={d.pnl >= 0 ? "text-green-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
        P&L: ${d.pnl.toFixed(2)}
      </p>
      <p className="text-slate-500">{d.trade_count} trade{d.trade_count !== 1 ? "s" : ""} ({periodLabel})</p>
    </div>
  );
}

interface Props {
  data: PnlDailyPoint[];
}

export default function DailyPnlChart({ data }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const gran = granularity(data.length);
  const formatted = groupData(data, gran);

  const gridColor = isDark ? "#1e293b" : "#f0f0f0";
  const tickColor = isDark ? "#94a3b8" : "#6b7280";

  const granLabel =
    gran === "monthly" ? "monthly" : gran === "weekly" ? "weekly" : null;

  return (
    <div>
      {granLabel && (
        <p className="text-[10px] text-slate-400 dark:text-slate-600 mb-1 text-right pr-1">
          grouped {granLabel}
        </p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={formatted} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={52} />
          <Tooltip content={<CustomTooltip gran={gran} />} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
          <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
            {formatted.map((entry, i) => (
              <Cell key={i} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
