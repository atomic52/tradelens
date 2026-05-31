import { clsx } from "clsx";
import type { Period } from "@/types";

const OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "ytd", label: "YTD" },
  { value: "all", label: "All" },
];

interface Props {
  value: Period;
  onChange: (p: Period) => void;
}

export default function PeriodToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg border bg-white overflow-hidden">
      {OPTIONS.map(({ value: v, label }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={clsx(
            "px-4 py-1.5 text-sm font-medium transition-colors",
            v === value
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
