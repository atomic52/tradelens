import { useState } from "react";
import { Link } from "react-router-dom";
import { auth as authApi } from "@/services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      // Don't reveal whether the email exists — always show success
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface flex-col justify-between p-12">
        <Link to="/" className="font-bold text-white text-lg tracking-tight">
          Trade<span className="text-brand-400">Lens</span>
        </Link>
        <div className="space-y-4">
          <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
            Forgot your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">
              password?
            </span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            No problem. Enter your email and we'll send you a link to reset it.
          </p>
        </div>
        <p className="text-xs text-slate-600">Trade smarter, not harder.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white px-6 py-12">
        <Link to="/" className="lg:hidden font-bold text-slate-900 text-lg tracking-tight mb-8">
          Trade<span className="text-brand-500">Lens</span>
        </Link>

        <div className="w-full max-w-sm space-y-7">
          {sent ? (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Check your email</h1>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  If an account exists for <span className="font-medium text-slate-700">{email}</span>,
                  you'll receive a password reset link shortly.
                </p>
              </div>
              <Link
                to="/login"
                className="block text-center text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reset your password</h1>
                <p className="text-sm text-slate-500 mt-1">We'll send a reset link to your email.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-slate-400"
                    placeholder="you@example.com"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>

              <p className="text-sm text-center text-slate-500">
                Remembered it?{" "}
                <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
