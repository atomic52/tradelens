import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useFirstAccount } from "@/hooks/useFirstAccount";
import Dashboard from "@/pages/Dashboard";
import ImportPage from "@/pages/ImportPage";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
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

// Redirect logged-in users away from public auth pages
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

function Layout() {
  const { user, logout } = useAuth();
  const { accounts } = useFirstAccount();
  const accountName = accounts[0]?.name;

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
        <div className="ml-auto flex items-center gap-3 text-sm text-gray-500">
          {accountName && <span className="hidden md:inline font-medium text-gray-700">{accountName}</span>}
          <span className="hidden md:inline">{user?.email}</span>
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

            {/* Private */}
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
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
