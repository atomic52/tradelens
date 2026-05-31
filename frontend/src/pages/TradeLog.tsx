import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { clsx } from "clsx";
import { format } from "date-fns";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trades as tradesApi } from "@/services/api";
import { useFirstAccount } from "@/hooks/useFirstAccount";
import type { Trade } from "@/types";

const col = createColumnHelper<Trade>();

const columns = [
  col.accessor("symbol", {
    header: "Symbol",
    cell: (i) => <span className="font-mono text-xs font-medium">{i.getValue()}</span>,
  }),
  col.accessor("asset_class", {
    header: "Type",
    cell: (i) => <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{i.getValue()}</span>,
  }),
  col.accessor("direction", {
    header: "Dir",
    cell: (i) => (
      <span className={clsx("text-xs font-medium", i.getValue() === "long" ? "text-green-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
        {i.getValue().toUpperCase()}
      </span>
    ),
  }),
  col.accessor("opened_at", {
    header: "Opened",
    cell: (i) => format(new Date(i.getValue()), "MMM d, yyyy"),
  }),
  col.accessor("closed_at", {
    header: "Closed",
    cell: (i) => (i.getValue() ? format(new Date(i.getValue()!), "MMM d, yyyy") : <span className="text-amber-600 text-xs">Open</span>),
  }),
  col.accessor("quantity", { header: "Qty", cell: (i) => Number(i.getValue()) }),
  col.accessor("avg_entry", {
    header: "Entry",
    cell: (i) => `$${Number(i.getValue()).toFixed(2)}`,
  }),
  col.accessor("avg_exit", {
    header: "Exit",
    cell: (i) => (i.getValue() != null ? `$${Number(i.getValue()).toFixed(2)}` : "—"),
  }),
  col.accessor("realized_pnl", {
    header: "P&L",
    cell: (i) => {
      const v = i.getValue();
      if (v == null) return "—";
      return (
        <span className={clsx("font-medium tabular-nums", Number(v) >= 0 ? "text-green-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
          {Number(v) >= 0 ? "+" : ""}${Number(v).toFixed(2)}
        </span>
      );
    },
  }),
  col.accessor("tags", {
    header: "Tags",
    cell: (i) =>
      i.getValue()
        ? i.getValue()!.split(",").map((t) => (
            <span key={t} className="inline-block bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs px-1.5 py-0.5 rounded mr-1">
              {t.trim()}
            </span>
          ))
        : null,
  }),
];

export default function TradeLog() {
  const navigate = useNavigate();
  const { accountId, isLoading: accountLoading } = useFirstAccount();
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data = [], isLoading } = useQuery<Trade[]>({
    queryKey: ["trades", accountId, statusFilter],
    queryFn: () => tradesApi.list(accountId!, statusFilter === "all" ? undefined : statusFilter),
    enabled: !!accountId,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  if (accountLoading || isLoading) return <p className="text-slate-400 dark:text-slate-500 py-8 text-center">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Trade Log</h1>
        <div className="inline-flex rounded-lg border dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden text-sm">
          {(["all", "closed", "open"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                "px-3 py-1.5 capitalize transition-colors",
                s === statusFilter
                  ? "bg-brand-600 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap"
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getIsSorted() === "asc" ? " ↑" : h.column.getIsSorted() === "desc" ? " ↓" : ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                onClick={() => navigate(`/trades/${row.original.id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <p className="text-center text-slate-400 dark:text-slate-500 py-12 text-sm">No trades found.</p>
        )}
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500">{data.length} trade{data.length !== 1 ? "s" : ""}</p>
    </div>
  );
}
