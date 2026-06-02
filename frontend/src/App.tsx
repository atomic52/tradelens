import { useState, useRef, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AccountProvider, useAccount } from "@/contexts/AccountContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { billing as billingApi } from "@/services/api";
import BillingCancelPage from "@/pages/BillingCancelPage";
import BillingSuccessPage from "@/pages/BillingSuccessPage";
import Dashboard from "@/pages/Dashboard";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ImportPage from "@/pages/ImportPage";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import SettingsPage from "@/pages/SettingsPage";
import TradeDetail from "@/pages/TradeDetail";
import TradeLog from "@/pages/TradeLog";

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function PrivateRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function navClass({ isActive }: { isActive: boolean }) {
  return `px-3 py-2 rounded text-sm font-medium transition-colors ${
    isActive
      ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
  }`;
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
    >
      {theme === "dark" ? (
        /* Sun icon */
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        /* Moon icon */
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}

function AccountSwitcher() {
  const { accounts, accountId, setAccountId } = useAccount();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = accounts.find((a) => a.id === accountId);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (accounts.length === 0) return null;

  // Single account — just show the name, no dropdown
  if (accounts.length === 1) {
    return (
      <span className="hidden md:inline text-sm font-medium text-slate-700">
        {current?.name}
      </span>
    );
  }

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
        {current?.name ?? "Select account"}
        <svg className="w-3.5 h-3.5 text-slate-400 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-50">
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => { setAccountId(a.id); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.id === accountId ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-600"}`} />
              <span className={`flex-1 truncate ${a.id === accountId ? "font-semibold text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"}`}>
                {a.name}
              </span>
              {a.id === accountId && (
                <svg className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UpgradeButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);

  if (user?.subscription_status === "pro") return null;

  const handleClick = async () => {
    setLoading(true);
    setErr(false);
    try {
      const { url } = await billingApi.createCheckout();
      window.location.href = url;
    } catch {
      setLoading(false);
      setErr(true);
    }
  };

  return (
    <div className="hidden sm:flex flex-col items-end gap-0.5">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 transition-all shadow-sm disabled:opacity-60"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
        </svg>
        {loading ? "Redirecting…" : "Upgrade to Pro"}
      </button>
      {err && <span className="text-[10px] text-red-400">Billing unavailable — try again</span>}
    </div>
  );
}

function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <nav className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-6 py-3 flex items-center gap-1">
        <NavLink to="/dashboard" className="font-bold text-slate-900 dark:text-slate-100 mr-4 text-base tracking-tight">
          Trade<span className="text-brand-500">Lens</span>
        </NavLink>
        <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
        <NavLink to="/trades" className={navClass}>Trade Log</NavLink>
        <NavLink to="/import" className={navClass}>Upload</NavLink>
        <NavLink to="/settings" className={navClass}>Settings</NavLink>
        <div className="ml-auto flex items-center gap-3">
          <UpgradeButton />
          <AccountSwitcher />
          <span className="hidden md:inline text-sm text-gray-400 dark:text-slate-500">{user?.email}</span>
          <ThemeToggle />
          <button
            onClick={() => logout()}
            className="px-3 py-1.5 rounded border dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
            <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/billing/success" element={<BillingSuccessPage />} />
            <Route path="/billing/cancel" element={<BillingCancelPage />} />

            {/* Private */}
            <Route element={<PrivateRoute />}>
              <Route element={
                <AccountProvider>
                  <Layout />
                </AccountProvider>
              }>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/trades" element={<TradeLog />} />
                <Route path="/trades/:id" element={<TradeDetail />} />
                <Route path="/import" element={<ImportPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
