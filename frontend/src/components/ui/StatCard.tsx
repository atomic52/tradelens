import { clsx } from "clsx";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  colorize?: boolean;
  size?: "default" | "large";
  accent?: boolean;
}

export default function StatCard({ label, value, sub, colorize, size = "default", accent }: Props) {
  const numericValue = typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]/g, "")) : value;
  const valueColor = colorize
    ? numericValue > 0 ? "text-emerald-600" : numericValue < 0 ? "text-red-500" : "text-slate-900"
    : "text-slate-900";

  return (
    <div className={clsx(
      "rounded-xl border p-4 flex flex-col",
      accent ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100",
    )}>
      <p className={clsx(
        "text-xs font-semibold uppercase tracking-wider mb-2",
        accent ? "text-slate-400" : "text-slate-400"
      )}>
        {label}
      </p>
      <p className={clsx(
        "font-bold tabular-nums leading-none",
        size === "large" ? "text-3xl" : "text-xl",
        accent ? (colorize ? (numericValue >= 0 ? "text-emerald-400" : "text-red-400") : "text-white") : valueColor,
      )}>
        {value}
      </p>
      <p className={clsx("text-xs mt-1.5 min-h-[1rem]", accent ? "text-slate-500" : "text-slate-400")}>
        {sub ?? ""}
      </p>
    </div>
  );
}
