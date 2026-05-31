import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { accounts as accountsApi } from "@/services/api";

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
    onError: () => setCreateError("Failed to create account."),
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

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

      {/* Accounts list */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Accounts</h2>
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : accountList.length === 0 ? (
          <p className="text-sm text-gray-400">No accounts yet.</p>
        ) : (
          <div className="bg-white rounded-lg border divide-y">
            {accountList.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.name}</p>
                  <p className="text-xs text-gray-400 capitalize">
                    {a.broker} · Created {format(new Date(a.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(a.id, a.name)}
                  disabled={deleteMutation.isPending}
                  className="text-xs text-red-600 hover:text-red-700 hover:underline disabled:opacity-40"
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
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">New Account</h2>
        <form onSubmit={handleCreate} className="bg-white rounded-lg border p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Robinhood Futures"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Broker</label>
            <select
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="robinhood">Robinhood</option>
              <option value="other">Other</option>
            </select>
          </div>
          {createError && <p className="text-sm text-red-600">{createError}</p>}
          <button
            type="submit"
            disabled={createMutation.isPending || !name.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating…" : "Create account"}
          </button>
        </form>
      </section>
    </div>
  );
}
