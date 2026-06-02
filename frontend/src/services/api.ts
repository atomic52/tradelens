import axios from "axios";
import type {
  Account,
  AnalyticsSummary,
  ImportResult,
  ImportUsage,
  Period,
  PnlDailyPoint,
  PnlHourPoint,
  PnlSymbolPoint,
  Trade,
  User,
} from "@/types";

// Requests always go to /api/v1 — Vercel proxies to Fly in production,
// Vite proxies to localhost:8000 in local dev. Same-origin in both cases.
const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true, // needed for httpOnly cookie
  timeout: 10_000,
});

// No Authorization header needed — the JWT lives in an httpOnly cookie
// set by the backend on login and cleared on logout.

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url: string = err.config?.url ?? "";
    const is401 = err.response?.status === 401;
    // Don't redirect on the session-check call itself — a 401 there just means
    // the user isn't logged in yet, which is expected on public pages.
    const isSessionCheck = url.includes("/users/me");
    if (is401 && !isSessionCheck) {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const auth = {
  login: (email: string, password: string) => {
    // fastapi-users CookieTransport expects OAuth2 form-data
    const form = new FormData();
    form.append("username", email);
    form.append("password", password);
    return api
      .post<{ detail: string }>("/auth/jwt/login", form)
      .then((r) => r.data);
  },
  logout: () => api.post("/auth/jwt/logout"),
  register: (email: string, password: string) =>
    api.post<User>("/auth/register", { email, password }).then((r) => r.data),
  me: () => api.get<User>("/users/me").then((r) => r.data),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post("/auth/reset-password", { token, password }),
};

export const accounts = {
  list: () => api.get<Account[]>("/accounts").then((r) => r.data),
  create: (data: { name: string; broker: string }) =>
    api.post<Account>("/accounts", data).then((r) => r.data),
  delete: (id: string) => api.delete(`/accounts/${id}`),
};

export const trades = {
  list: (accountId: string, status?: string) =>
    api
      .get<Trade[]>(`/accounts/${accountId}/trades`, { params: status ? { status } : {} })
      .then((r) => r.data),
  get: (tradeId: string) => api.get<Trade>(`/trades/${tradeId}`).then((r) => r.data),
  update: (tradeId: string, data: { notes?: string; tags?: string }) =>
    api.patch<Trade>(`/trades/${tradeId}`, data).then((r) => r.data),
  delete: (tradeId: string) => api.delete(`/trades/${tradeId}`),
};

export const imports = {
  robinhoodCsv: (accountId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<ImportResult>(`/accounts/${accountId}/import/robinhood-csv`, form).then((r) => r.data);
  },
  futuresPdf: (accountId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<ImportResult>(`/accounts/${accountId}/import/futures-pdf`, form).then((r) => r.data);
  },
  nonfuturesPdf: (accountId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<ImportResult>(`/accounts/${accountId}/import/nonfutures-pdf`, form).then((r) => r.data);
  },
  usage: () =>
    api.get<ImportUsage>("/imports/usage").then((r) => r.data),
};

export const billing = {
  createCheckout: () =>
    api.post<{ url: string }>("/billing/checkout").then((r) => r.data),
  createPortal: () =>
    api.post<{ url: string }>("/billing/portal").then((r) => r.data),
};

export const analytics = {
  summary: (accountId: string, period: Period = "all") =>
    api
      .get<AnalyticsSummary>(`/accounts/${accountId}/analytics/summary`, { params: { period } })
      .then((r) => r.data),
  pnlDaily: (accountId: string, days = 30) =>
    api
      .get<PnlDailyPoint[]>(`/accounts/${accountId}/analytics/pnl-daily`, { params: { days } })
      .then((r) => r.data),
  pnlByHour: (accountId: string, period: Period = "all") =>
    api
      .get<PnlHourPoint[]>(`/accounts/${accountId}/analytics/pnl-by-hour`, { params: { period } })
      .then((r) => r.data),
  pnlBySymbol: (accountId: string, period: Period = "all") =>
    api
      .get<PnlSymbolPoint[]>(`/accounts/${accountId}/analytics/pnl-by-symbol`, { params: { period } })
      .then((r) => r.data),
  pnlCumulative: (accountId: string, period: Period = "all") =>
    api
      .get<PnlDailyPoint[]>(`/accounts/${accountId}/analytics/pnl-cumulative`, { params: { period } })
      .then((r) => r.data),
};
