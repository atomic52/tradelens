import { useState } from "react";
import { clsx } from "clsx";
import { format } from "date-fns";
import type { DateRange, Period } from "@/types";
import DateRangePicker from "./DateRangePicker";

const OPTIONS: { value: Exclude<Period, "custom">; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "ytd", label: "YTD" },
  { value: "all", label: "All" },
];

interface Props {
  value: Period;
  onChange: (p: Period) => void;
  dateRange: DateRange | null;
  onDateRangeChange: (r: DateRange) => void;
}

export default function PeriodToggle({ value, onChange, dateRange, onDateRangeChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function handleCustomClick() {
    setPickerOpen((o) => !o);
    if (value !== "custom") onChange("custom");
  }

  function handleRangeChange(r: DateRange) {
    onDateRangeChange(r);
    onChange("custom");
    setPickerOpen(false);
  }

  const customLabel =
    value === "custom" && dateRange
      ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}`
      : "Custom";

  return (
    <div className="relative flex items-center">
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
        <button
          onClick={handleCustomClick}
          className={clsx(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
            value === "custom"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          )}
        >
          {customLabel}
        </button>
      </div>

      {pickerOpen && (
        <DateRangePicker
          value={dateRange}
          onChange={handleRangeChange}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
