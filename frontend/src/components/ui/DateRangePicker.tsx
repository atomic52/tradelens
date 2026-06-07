import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, isAfter, isBefore } from "date-fns";
import type { DateRange as DayPickerRange } from "react-day-picker";
import type { DateRange } from "@/types";
import "react-day-picker/dist/style.css";

interface Props {
  value: DateRange | null;
  onChange: (range: DateRange) => void;
  onClose: () => void;
}

export default function DateRangePicker({ value, onChange, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [selecting, setSelecting] = useState<DayPickerRange | undefined>(
    value ? { from: value.from, to: value.to } : undefined
  );

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  function handleSelect(range: DayPickerRange | undefined) {
    setSelecting(range);
    if (range?.from && range?.to) {
      const from = isBefore(range.from, range.to) ? range.from : range.to;
      const to = isAfter(range.to, range.from) ? range.to : range.from;
      onChange({ from, to });
      onClose();
    }
  }

  const label =
    value
      ? `${format(value.from, "MMM d, yyyy")} – ${format(value.to, "MMM d, yyyy")}`
      : "Select range";

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-50 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-3"
    >
      <div className="mb-2 px-1 text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
        {label}
      </div>
      <DayPicker
        mode="range"
        selected={selecting}
        onSelect={handleSelect}
        numberOfMonths={2}
        disabled={{ after: new Date() }}
        classNames={{
          root: "rdp-custom",
          months: "flex gap-4",
          month: "space-y-2",
          caption: "flex items-center justify-between px-1",
          caption_label: "text-sm font-semibold text-slate-800 dark:text-slate-200",
          nav: "flex items-center gap-1",
          nav_button:
            "w-6 h-6 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
          nav_button_previous: "",
          nav_button_next: "",
          table: "w-full border-collapse",
          head_row: "flex",
          head_cell:
            "w-8 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500 py-1",
          row: "flex mt-0.5",
          cell: "relative",
          day: "w-8 h-8 text-xs flex items-center justify-center rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer",
          day_selected:
            "bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 font-semibold",
          day_range_middle:
            "rounded-none bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/40",
          day_range_start: "rounded-l-md",
          day_range_end: "rounded-r-md",
          day_today:
            "font-bold text-brand-600 dark:text-brand-400 ring-1 ring-brand-400 dark:ring-brand-500",
          day_outside: "opacity-30",
          day_disabled: "opacity-20 cursor-not-allowed",
        }}
      />
      <div className="flex justify-end mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onClose}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1 rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
