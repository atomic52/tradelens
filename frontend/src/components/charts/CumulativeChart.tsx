import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PnlDailyPoint } from "@/types";

interface Props {
  data: PnlDailyPoint[];
}

export default function CumulativeChart({ data }: Props) {
  const finalPnl = data.length ? data[data.length - 1].cumulative_pnl : 0;
  const color = finalPnl >= 0 ? "#22c55e" : "#ef4444";
  const gradId = finalPnl >= 0 ? "cumGreen" : "cumRed";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={52} />
        <Tooltip
          formatter={(v) => [`$${Number(v).toFixed(2)}`, "Cumulative P&L"]}
          contentStyle={{ fontSize: 12, borderRadius: 6 }}
        />
        <Area
          type="monotone"
          dataKey="cumulative_pnl"
          stroke={color}
          fill={`url(#${gradId})`}
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
