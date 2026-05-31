import { clsx } from "clsx";

interface Props {
  label: string;
  value: string | number;
  subValue?: string;
  colorize?: boolean;
}

export default function StatCard({ label, value, subValue, colorize }: Props) {
  const numericValue = typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]/g, "")) : value;
  const valueColor = colorize
    ? numericValue > 0
      ? "text-green-600"
      : numericValue < 0
      ? "text-red-600"
      : "text-gray-900"
    : "text-gray-900";

  return (
    <div className="bg-white rounded-lg border p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={clsx("text-2xl font-semibold mt-1 tabular-nums", valueColor)}>{value}</p>
      {subValue && <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>}
    </div>
  );
}
