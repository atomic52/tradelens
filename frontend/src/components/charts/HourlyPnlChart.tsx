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
import type { PnlHourPoint } from "@/types";

interface Props {
  data: PnlHourPoint[];
}

function hourLabel(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: PnlHourPoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border rounded shadow-lg px-3 py-2 text-xs space-y-0.5">
      <p className="font-medium text-gray-700">{hourLabel(d.hour)}</p>
      <p className={d.pnl >= 0 ? "text-green-600" : "text-red-600"}>P&L: ${d.pnl.toFixed(2)}</p>
      <p className="text-gray-500">Win rate: {d.win_rate.toFixed(1)}%</p>
      <p className="text-gray-500">{d.trade_count} trade{d.trade_count !== 1 ? "s" : ""}</p>
    </div>
  );
}

export default function HourlyPnlChart({ data }: Props) {
  const formatted = data.map((d) => ({ ...d, label: hourLabel(d.hour) }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={52} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
          {formatted.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
