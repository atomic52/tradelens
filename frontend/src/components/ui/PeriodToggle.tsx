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
    <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 gap-0.5">
      {OPTIONS.map(({ value: v, label }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={clsx(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
            v === value
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
