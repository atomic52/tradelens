import axios from "axios";
import type {
  Account,
  AnalyticsSummary,
  ImportResult,
  Period,
  PnlDailyPoint,
  PnlHourPoint,
  PnlSymbolPoint,
  Trade,
  User,
} from "@/types";

// In production set VITE_API_BASE_URL=https://your-app.fly.dev/api/v1
// Locally this falls back to /api/v1 which Vite proxies to localhost:8000
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const auth = {
  login: (email: string, password: string) => {
    const form = new FormData();
    form.append("username", email);
    form.append("password", password);
    return api.post<{ access_token: string; token_type: string }>("/auth/jwt/login", form).then((r) => r.data);
  },
  register: (email: string, password: string) =>
    api.post<User>("/auth/register", { email, password }).then((r) => r.data),
  me: () => api.get<User>("/users/me").then((r) => r.data),
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
    api.get<{ used: number; limit: number }>("/imports/usage").then((r) => r.data),
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
