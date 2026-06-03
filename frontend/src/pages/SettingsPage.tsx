import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { accounts as accountsApi, billing as billingApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

function AccountUpgradeBanner() {
  const [loading, setLoading] = useState(false);
  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { url } = await billingApi.createCheckout();
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };
  return (
    <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 px-3 py-2.5 text-sm text-orange-800 dark:text-orange-300">
      <p className="font-medium">Account limit reached</p>
      <p className="text-xs mt-0.5 mb-2">Free plan supports 1 account. Upgrade to Pro for up to 5 accounts.</p>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? "Redirecting…" : "Upgrade to Pro"}
      </button>
    </div>
  );
}

function PlanSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const isPro = user?.subscription_status === "pro";

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { url } = await billingApi.createCheckout();
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    try {
      const { url } = await billingApi.createPortal();
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Plan</h2>
      <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-800 p-4 flex items-center justify-between gap-4">
        <div>
          {isPro ? (
            <>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">✦ TradeLens Pro</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Unlimited uploads · all features</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Free tier</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">10 uploads included · upgrade for unlimited</p>
            </>
          )}
        </div>
        {isPro ? (
          <button
            onClick={handleManage}
            disabled={loading}
            className="text-sm text-slate-600 dark:text-slate-400 hover:underline disabled:opacity-50"
          >
            {loading ? "Redirecting…" : "Manage subscription"}
          </button>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Redirecting…" : "Upgrade to Pro — $20/mo"}
          </button>
        )}
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: accountList = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: accountsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });

  const [name, setName] = useState("");
  const [broker, setBroker] = useState("robinhood");
  const [createError, setCreateError] = useState("");

  const createMutation = useMutation({
    mutationFn: () => accountsApi.create({ name: name.trim(), broker }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      setName("");
      setBroker("robinhood");
      setCreateError("");
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "";
      if (status === 402) {
        setCreateError("upgrade");
      } else {
        setCreateError(detail || "Failed to create account.");
      }
    },
  });

  const handleDelete = (id: string, accountName: string) => {
    if (window.confirm(`Delete account "${accountName}"? This will also delete all trades and import history.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate();
  };

  const inputCls = "w-full border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500";

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>

      <PlanSection />

      {/* Accounts list */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Accounts</h2>
        {isLoading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
        ) : accountList.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">No accounts yet.</p>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-800 divide-y dark:divide-slate-800">
            {accountList.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{a.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">
                    {a.broker} · Created {format(new Date(a.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(a.id, a.name)}
                  disabled={deleteMutation.isPending}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* New account form */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">New Account</h2>
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-800 p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Robinhood Futures"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Broker</label>
            <select
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              className={inputCls}
            >
              <option value="robinhood">Robinhood</option>
              <option value="other">Other</option>
            </select>
          </div>
          {createError === "upgrade" ? (
            <AccountUpgradeBanner />
          ) : createError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
          ) : null}
          <button
            type="submit"
            disabled={createMutation.isPending || !name.trim()}
            className="bg-brand-600 text-white px-4 py-2 rounded text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? "Creating…" : "Create account"}
          </button>
        </form>
      </section>
    </div>
  );
}
