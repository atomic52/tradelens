import { useState, useRef, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AccountProvider, useAccount } from "@/contexts/AccountContext";
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
    isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
  }`;
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
        className="flex items-center gap-1.5 text-sm font-medium text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
        {current?.name ?? "Select account"}
        <svg className="w-3.5 h-3.5 text-slate-400 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => { setAccountId(a.id); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.id === accountId ? "bg-brand-500" : "bg-slate-200"}`} />
              <span className={`flex-1 truncate ${a.id === accountId ? "font-semibold text-slate-900" : "text-slate-600"}`}>
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

function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center gap-1">
        <NavLink to="/dashboard" className="font-bold text-slate-900 mr-4 text-base tracking-tight">
          Trade<span className="text-brand-500">Lens</span>
        </NavLink>
        <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
        <NavLink to="/trades" className={navClass}>Trade Log</NavLink>
        <NavLink to="/import" className={navClass}>Import</NavLink>
        <NavLink to="/settings" className={navClass}>Settings</NavLink>
        <div className="ml-auto flex items-center gap-3">
          <AccountSwitcher />
          <span className="hidden md:inline text-sm text-gray-400">{user?.email}</span>
          <button
            onClick={() => logout()}
            className="px-3 py-1.5 rounded border text-gray-600 hover:bg-gray-50 text-xs"
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
  );
}
