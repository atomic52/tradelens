import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const inputCls = "w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justReset = searchParams.get("reset") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* ── Left panel (always dark) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface flex-col justify-between p-12">
        <Link to="/" className="font-bold text-white text-lg tracking-tight">
          Trade<span className="text-brand-400">Lens</span>
        </Link>

        <div className="space-y-6">
          <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
            Welcome back.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">
              Your edge awaits.
            </span>
          </h2>
          <div className="space-y-3">
            {[
              "Daily, weekly, and all-time P&L charts",
              "FIFO trade matching for futures & options",
              "Per-trade journal with notes and tags",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">Trade smarter, not harder.</p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white dark:bg-slate-950 px-6 py-12">
        {/* Mobile wordmark */}
        <Link to="/" className="lg:hidden font-bold text-slate-900 dark:text-slate-100 text-lg tracking-tight mb-8">
          Trade<span className="text-brand-500">Lens</span>
        </Link>

        <div className="w-full max-w-sm space-y-7">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Sign in</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter your email and password to continue.</p>
          </div>

          {justReset && (
            <div className="rounded-lg bg-green-50 dark:bg-emerald-950/30 border border-green-200 dark:border-emerald-800 px-3 py-2.5 text-sm text-green-700 dark:text-emerald-300">
              Password reset successfully. Sign in with your new password.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm shadow-brand-900/20"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-center text-slate-500 dark:text-slate-400">
            No account?{" "}
            <Link to="/register" className="text-brand-600 hover:text-brand-700 dark:hover:text-brand-400 font-medium">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
