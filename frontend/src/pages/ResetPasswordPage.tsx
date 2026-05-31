import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { auth as authApi } from "@/services/api";

const inputCls = "w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!token) { setError("Invalid or missing reset token."); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      navigate("/login?reset=1");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Reset failed. The link may have expired — request a new one.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 px-6">
        <div className="text-center space-y-3">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Invalid reset link.</p>
          <Link to="/forgot-password" className="text-brand-600 text-sm font-medium hover:underline">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left panel (always dark) */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface flex-col justify-between p-12">
        <Link to="/" className="font-bold text-white text-lg tracking-tight">
          Trade<span className="text-brand-400">Lens</span>
        </Link>
        <div className="space-y-4">
          <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
            Choose a new<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">
              password.
            </span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Pick something strong. Min. 8 characters with at least one uppercase letter and one number.
          </p>
        </div>
        <p className="text-xs text-slate-600">Trade smarter, not harder.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white dark:bg-slate-950 px-6 py-12">
        <Link to="/" className="lg:hidden font-bold text-slate-900 dark:text-slate-100 text-lg tracking-tight mb-8">
          Trade<span className="text-brand-500">Lens</span>
        </Link>

        <div className="w-full max-w-sm space-y-7">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Set new password</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your new password must be different from your old one.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                placeholder="Min. 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputCls}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Set new password"}
            </button>
          </form>

          <p className="text-sm text-center text-slate-500 dark:text-slate-400">
            Link expired?{" "}
            <Link to="/forgot-password" className="text-brand-600 hover:text-brand-700 dark:hover:text-brand-400 font-medium">
              Request a new one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
