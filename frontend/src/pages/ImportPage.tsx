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
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>

      <p className="text-xs text-gray-400 bg-gray-50 rounded p-3 leading-relaxed">{instructions}</p>

      <div className="space-y-3">
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          onChange={(e) => setHasFile(!!e.target.files?.[0])}
          className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={mutation.isPending || !hasFile}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? "Importing..." : "Import"}
        </button>
      </div>

      {duplicate && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          This file has already been imported. Delete existing trades first if you want to re-import.
        </div>
      )}
      {errorMsg === "upgrade" && (
        <div className="rounded-md bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-800">
          <p className="font-medium">Free tier limit reached</p>
          <p className="mt-0.5">You've used all 5 free imports. Upgrade to Pro for unlimited imports.</p>
        </div>
      )}
      {errorMsg && errorMsg !== "upgrade" && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
      {result && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
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
      <div className="text-center py-20 text-gray-500 text-sm">
        Create an account in <a href="/settings" className="text-blue-600 hover:underline">Settings</a> before importing.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Import</h1>
        {usage && (
          <div className={`text-sm px-3 py-1.5 rounded-full border ${
            usage.used >= usage.limit
              ? "bg-orange-50 border-orange-200 text-orange-700"
              : usage.used >= usage.limit - 1
              ? "bg-yellow-50 border-yellow-200 text-yellow-700"
              : "bg-gray-50 border-gray-200 text-gray-500"
          }`}>
            {usage.used} / {usage.limit} free imports used
          </div>
        )}
      </div>
      {usage && usage.used >= usage.limit && (
        <div className="rounded-md bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-800">
          <span className="font-medium">Free tier limit reached.</span> You've used all {usage.limit} free imports. Upgrade to Pro for unlimited imports.
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-6">
        <ImportCard
          title="Robinhood CSV"
          description="Stocks & options trade history"
          instructions="In Robinhood: Account → Statements & History → Export CSV. Download the file and upload it here."
          accept=".csv"
          onImport={(f) => importsApi.robinhoodCsv(accountId, f)}
          onSuccess={invalidate}
        />
        <ImportCard
          title="Futures PDF"
          description="Robinhood Derivatives daily or monthly statement"
          instructions="Log in to Robinhood → Account → Statements → Futures Statements. Download either a daily or monthly PDF."
          accept=".pdf"
          onImport={(f) => importsApi.futuresPdf(accountId, f)}
          onSuccess={invalidate}
        />
        <ImportCard
          title="Non-Futures PDF"
          description="Robinhood monthly brokerage statement"
          instructions="Log in to Robinhood → Account → Statements → Monthly Statements. Download a monthly PDF (the one without Derivatives in the title)."
          accept=".pdf"
          onImport={(f) => importsApi.nonfuturesPdf(accountId, f)}
          onSuccess={invalidate}
        />
      </div>
    </div>
  );
}
