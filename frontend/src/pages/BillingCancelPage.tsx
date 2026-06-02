import { Link } from "react-router-dom";

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
        <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Checkout cancelled</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
        No worries — you haven't been charged. You can upgrade to Pro any time from Settings.
      </p>
      <div className="flex gap-4 mt-6">
        <Link
          to="/settings"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
        >
          Back to Settings
        </Link>
        <Link
          to="/dashboard"
          className="border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-4 py-2 rounded text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
