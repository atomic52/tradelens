import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export default function BillingSuccessPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const qc = useQueryClient();

  // Re-fetch the current user so subscription_status updates immediately
  useEffect(() => {
    refreshUser().then(() => {
      qc.invalidateQueries({ queryKey: ["import-usage"] });
    }).catch(() => {});
    const t = setTimeout(() => navigate("/settings"), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-6">
        <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">You're on Pro 🎉</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
        Your TradeLens Pro subscription is now active. Enjoy unlimited uploads and all Pro features.
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">Redirecting to Settings in a few seconds…</p>
      <Link to="/settings" className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
        Go to Settings now →
      </Link>
    </div>
  );
}
