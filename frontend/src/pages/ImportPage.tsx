import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { imports as importsApi } from "@/services/api";
import { useFirstAccount } from "@/hooks/useFirstAccount";
import type { ImportResult } from "@/types";

interface ImportCardProps {
  title: string;
  description: string;
  instructions: string;
  accept: string;
  onImport: (file: File) => Promise<ImportResult>;
  onSuccess: () => void;
}

function ImportCard({ title, description, instructions, accept, onImport, onSuccess }: ImportCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [hasFile, setHasFile] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState(false);

  const mutation = useMutation({
    mutationFn: (file: File) => onImport(file),
    onSuccess: (data) => {
      setResult(data);
      setErrorMsg(null);
      setDuplicate(false);
      setHasFile(false);
      onSuccess();
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "";
      setResult(null);
      if (status === 409) {
        setDuplicate(true);
        setErrorMsg(null);
      } else if (status === 402) {
        setDuplicate(false);
        setErrorMsg("upgrade");
      } else {
        setDuplicate(false);
        setErrorMsg(detail || `Import failed (HTTP ${status ?? "unknown"}). Check the file and try again.`);
      }
    },
  });

  const handleImport = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setResult(null);
    setErrorMsg(null);
    setDuplicate(false);
    mutation.mutate(file);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-800 p-6 flex flex-col">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 rounded p-3 leading-relaxed flex-1">{instructions}</p>

      <div className="space-y-3 mt-4">
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          onChange={(e) => setHasFile(!!e.target.files?.[0])}
          className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-brand-50 dark:file:bg-brand-950 file:text-brand-700 dark:file:text-brand-300 hover:file:bg-brand-100 dark:hover:file:bg-brand-900"
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={mutation.isPending || !hasFile}
          className="bg-brand-600 text-white px-4 py-2 rounded text-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {mutation.isPending ? "Uploading..." : "Upload"}
        </button>
      </div>

      {duplicate && (
        <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          This file has already been imported. Delete existing trades first if you want to re-import.
        </div>
      )}
      {errorMsg === "upgrade" && (
        <div className="rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 px-4 py-3 text-sm text-orange-800 dark:text-orange-300">
          <p className="font-medium">Free tier limit reached</p>
          <p className="mt-0.5">You've used all 5 free uploads. Upgrade to Pro for unlimited uploads.</p>
        </div>
      )}
      {errorMsg && errorMsg !== "upgrade" && (
        <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {errorMsg}
        </div>
      )}
      {result && (
        <div className="rounded-md bg-green-50 dark:bg-emerald-950/30 border border-green-200 dark:border-emerald-800 px-4 py-3 text-sm text-green-700 dark:text-emerald-300">
          Imported {result.trades_imported} trades ({result.executions_imported} executions).
        </div>
      )}
    </div>
  );
}

export default function ImportPage() {
  const { accountId } = useFirstAccount();
  const qc = useQueryClient();

  const { data: usage } = useQuery({
    queryKey: ["import-usage"],
    queryFn: importsApi.usage,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["import-usage"] });
    qc.invalidateQueries({ queryKey: ["trades"] });
    qc.invalidateQueries({ queryKey: ["summary"] });
    qc.invalidateQueries({ queryKey: ["pnl-daily"] });
    qc.invalidateQueries({ queryKey: ["pnl-cumulative"] });
    qc.invalidateQueries({ queryKey: ["pnl-by-hour"] });
    qc.invalidateQueries({ queryKey: ["pnl-by-symbol"] });
  };

  if (!accountId) {
    return (
      <div className="text-center py-20 text-slate-500 dark:text-slate-400 text-sm">
        Create an account in <a href="/settings" className="text-brand-600 hover:underline">Settings</a> before uploading.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Upload</h1>
        {usage && (
          <div className={`text-sm px-3 py-1.5 rounded-full border ${
            usage.used >= usage.limit
              ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300"
              : usage.used >= usage.limit - 1
              ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          }`}>
            {usage.used} / {usage.limit} free uploads used
          </div>
        )}
      </div>
      {usage && usage.used >= usage.limit && (
        <div className="rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 px-4 py-3 text-sm text-orange-800 dark:text-orange-300">
          <span className="font-medium">Free tier limit reached.</span> You've used all {usage.limit} free uploads. Upgrade to Pro for unlimited uploads.
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-6">
        <ImportCard
          title="Trade History CSV"
          description="Stocks & options activity report"
          instructions="In Robinhood: Reports and statements → Reports → Export CSV. Download the file and upload it here."
          accept=".csv"
          onImport={(f) => importsApi.robinhoodCsv(accountId, f)}
          onSuccess={invalidate}
        />
        <ImportCard
          title="Futures & Event Contracts"
          description="Monthly futures & event contracts statement"
          instructions="In Robinhood: Reports and statements → Monthly statements → Futures & event contracts. Download any monthly PDF."
          accept=".pdf"
          onImport={(f) => importsApi.futuresPdf(accountId, f)}
          onSuccess={invalidate}
        />
        <ImportCard
          title="Individual Investing Statement"
          description="Monthly individual investing account statement"
          instructions="In Robinhood: Reports and statements → Monthly statements → Individual. Download any monthly PDF."
          accept=".pdf"
          onImport={(f) => importsApi.nonfuturesPdf(accountId, f)}
          onSuccess={invalidate}
        />
      </div>
    </div>
  );
}
