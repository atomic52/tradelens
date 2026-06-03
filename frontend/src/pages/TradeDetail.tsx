import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import { format } from "date-fns";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trades as tradesApi } from "@/services/api";
import type { Trade } from "@/types";

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: trade, isLoading } = useQuery<Trade>({
    queryKey: ["trade", id],
    queryFn: () => tradesApi.get(id!),
    enabled: !!id,
  });

  const [notes, setNotes] = useState<string | null>(null);
  const [tags, setTags] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      tradesApi.update(id!, {
        notes: notes ?? trade?.notes ?? "",
        tags: tags ?? trade?.tags ?? "",
      }),
    onSuccess: (updated) => {
      qc.setQueryData(["trade", id], updated);
      qc.invalidateQueries({ queryKey: ["trades"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tradesApi.delete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
      navigate("/trades");
    },
  });

  const handleDelete = () => {
    if (window.confirm("Delete this trade? This cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) return <p className="text-slate-400 dark:text-slate-500 py-12 text-center">Loading…</p>;
  if (!trade) return null;

  const pnl = trade.realized_pnl != null ? Number(trade.realized_pnl) : null;
  const currentNotes = notes ?? trade.notes ?? "";
  const currentTags = tags ?? trade.tags ?? "";

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => navigate("/trades")} className="text-sm text-brand-600 hover:underline">
        ← Back to trades
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-800 p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">{trade.symbol}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 capitalize">{trade.asset_class} · {trade.direction}</p>
          </div>
          <span
            className={clsx(
              "text-xl font-semibold tabular-nums",
              pnl == null ? "text-slate-400" : pnl >= 0 ? "text-green-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
            )}
          >
            {pnl != null ? `${pnl >= 0 ? "+$" : "-$"}${Math.abs(pnl).toFixed(2)}` : "Open"}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t dark:border-slate-800 pt-4">
          {[
            ["Quantity", trade.quantity],
            ["Avg Entry", `$${Number(trade.avg_entry).toFixed(2)}`],
            ["Avg Exit", trade.avg_exit != null ? `$${Number(trade.avg_exit).toFixed(2)}` : "—"],
            ["Fees", `$${Number(trade.fees).toFixed(2)}`],
            ["Opened", format(new Date(trade.opened_at), "MMM d, yyyy HH:mm")],
            ["Closed", trade.closed_at ? format(new Date(trade.closed_at), "MMM d, yyyy HH:mm") : "—"],
            ["Status", <span className={clsx("capitalize", trade.status === "open" ? "text-amber-600" : "text-green-600 dark:text-emerald-400")}>{trade.status}</span>],
            ["Multiplier", `×${Number(trade.contract_multiplier)}`],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <p className="text-slate-400 dark:text-slate-500 text-xs uppercase">{label}</p>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        <div className="border-t dark:border-slate-800 pt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags</label>
            <input
              className="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500"
              value={currentTags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="breakout, scalp, earnings…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea
              className="w-full border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-[100px] placeholder-slate-400 dark:placeholder-slate-500"
              value={currentNotes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What was your thesis? What went wrong or right?"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-brand-600 text-white px-4 py-2 rounded text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-red-600 dark:text-red-400 text-sm hover:underline disabled:opacity-50"
            >
              Delete trade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
