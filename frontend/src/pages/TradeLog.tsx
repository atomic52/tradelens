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
    cell: (i) => <span className="text-xs text-gray-500 capitalize">{i.getValue()}</span>,
  }),
  col.accessor("direction", {
    header: "Dir",
    cell: (i) => (
      <span className={clsx("text-xs font-medium", i.getValue() === "long" ? "text-green-600" : "text-red-500")}>
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
        <span className={clsx("font-medium tabular-nums", Number(v) >= 0 ? "text-green-600" : "text-red-500")}>
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
            <span key={t} className="inline-block bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded mr-1">
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

  if (accountLoading || isLoading) return <p className="text-gray-400 py-8 text-center">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Trade Log</h1>
        <div className="inline-flex rounded-lg border bg-white overflow-hidden text-sm">
          {(["all", "closed", "open"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                "px-3 py-1.5 capitalize transition-colors",
                s === statusFilter ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap"
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getIsSorted() === "asc" ? " ↑" : h.column.getIsSorted() === "desc" ? " ↓" : ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 cursor-pointer"
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
          <p className="text-center text-gray-400 py-12 text-sm">No trades found.</p>
        )}
      </div>
      <p className="text-xs text-gray-400">{data.length} trade{data.length !== 1 ? "s" : ""}</p>
    </div>
  );
}
