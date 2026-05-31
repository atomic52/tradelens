# TradeLens — Frontend

React 18 + TypeScript + Vite + TailwindCSS. Deployed on Vercel.

## Structure

```
src/
  pages/          # Dashboard, TradeLog, TradeDetail, ImportPage, SettingsPage,
                  # LoginPage, RegisterPage, LandingPage
  components/
    charts/       # DailyPnlChart, CumulativeChart, HourlyPnlChart, SymbolPnlTable
    ui/           # StatCard, PeriodToggle
  contexts/       # AuthContext — JWT token + user state
  hooks/          # useFirstAccount
  services/
    api.ts        # Axios client — Bearer auth interceptor, 401 → /login redirect
  types/
    index.ts      # Shared TypeScript types
```

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | Production only | `/api/v1` (Vite proxy) | Full URL to the backend API, e.g. `https://tradelens-api.fly.dev/api/v1` |

For local development no `.env` is needed — Vite proxies `/api` to `localhost:8000` via `vite.config.ts`.

For production, set this in the Vercel dashboard or via CLI:

```bash
vercel env add VITE_API_BASE_URL production
# Enter: https://tradelens-api.fly.dev/api/v1
```

---

## Local development

```bash
cd frontend
npm install
npm run dev
# UI at http://localhost:5173
```

Requires the backend to be running at `localhost:8000` (see `../backend/README.md` or use `../dev.sh`).

---

## Build

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build locally
```

---

## Production deployment (Vercel)

### First-time setup

```bash
npm install -g vercel
cd frontend
vercel login   # authenticate with GitHub

vercel --prod
# When prompted:
#   Team: your team
#   Link to existing project? No → name it "tradelens"
#   Directory: ./
#   Customize settings? No  (vercel.json already has the right config)

# Set the backend URL env var
vercel env add VITE_API_BASE_URL production
# Enter: https://tradelens-api.fly.dev/api/v1

# Redeploy to pick up the env var
vercel --prod
```

### Subsequent deploys

```bash
cd frontend && vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard for automatic deploys on push to `main`.

### Configuration

`vercel.json` in this directory sets:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

The rewrite rule makes client-side routing work — all paths serve `index.html` and React Router takes over.

### Useful commands

```bash
vercel env ls                          # List environment variables
vercel env add KEY production          # Add/update a variable
vercel logs https://your-app.vercel.app  # View recent logs
```

---

## Tailwind / design tokens

Custom tokens are defined in `tailwind.config.js`:

| Token | Value | Usage |
|---|---|---|
| `brand-500` | `#6366f1` (indigo) | Primary buttons, links, active nav |
| `surface` | `#0f172a` (dark slate) | Hero, auth left panel, dark sections |
| `surface-card` | `#1e293b` | Dark cards |
| `surface-border` | `#334155` | Dark borders |

Font: **Inter** via Google Fonts (loaded in `index.html`).
