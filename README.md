# TradeLens

A trade journal and analytics platform for active traders. Import your Robinhood statements, visualise P&L, and track performance metrics.

## Quick Start (local)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Python 3.12+ with [Poetry](https://python-poetry.org/)
- Node.js 18+

### One-command startup

```bash
./dev.sh
```

That's it. The script will:

1. Start PostgreSQL in Docker
2. Run Alembic migrations
3. Start the FastAPI backend (`http://localhost:8000`)
4. Install frontend dependencies (if needed) and start Vite (`http://localhost:5173`)

Press **Ctrl+C** to stop everything cleanly.

**Open in browser:** http://localhost:5173

### First run

1. Go to http://localhost:5173/register and create an account
2. Head to **Settings** and create a trading account (e.g. "Robinhood Futures")
3. Go to **Import** and upload a Robinhood PDF statement
4. View your trades and analytics on the **Dashboard**

---

## Manual startup (without dev.sh)

<details>
<summary>Expand</summary>

### 1. Start the database
```bash
docker compose up -d
```

### 2. Backend
```bash
cd backend
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload
# API at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# UI at http://localhost:5173
```

</details>

---

## Importing trades

TradeLens supports three Robinhood import formats:

| Format | Where to get it |
|---|---|
| **Futures PDF** (daily or monthly) | Robinhood → Account → Statements → Futures confirmations |
| **Non-futures PDF** (monthly) | Robinhood → Account → Statements → Monthly statement |
| **CSV** | Robinhood → Account → Statements & History → Export CSV |

Upload via the **Import** page. Duplicate uploads are detected automatically (SHA-256 deduplication).

---

## Project structure

```
backend/
  app/
    api/v1/endpoints/   # FastAPI route handlers (accounts, trades, imports, analytics)
    models/             # SQLAlchemy ORM models
    schemas/            # Pydantic request/response schemas
    services/           # Trade matching (FIFO), contract specs, import logic
    parsers/            # PDF/CSV parsers (rh_futures_pdf, rh_nonfutures_pdf, robinhood)
    core/               # Config, JWT auth (fastapi-users)
    db/                 # Async DB engine + session

frontend/
  src/
    pages/              # Dashboard, TradeLog, TradeDetail, ImportPage, SettingsPage
    components/         # Charts (Daily P&L, Cumulative, Hourly, Symbol) + UI primitives
    contexts/           # AuthContext (JWT)
    hooks/              # useFirstAccount
    services/api.ts     # Axios client with Bearer auth + 401 redirect
    types/index.ts      # Shared TypeScript types
```

## Adding a new broker

1. Add `backend/app/parsers/<broker>.py` — implement `parse_<broker>() -> list[RawExecution]`
2. Add a route in `backend/app/api/v1/endpoints/imports.py`
3. Add an import card in `frontend/src/pages/ImportPage.tsx`

## Tech stack

| Layer | Stack |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 (async), Alembic, fastapi-users |
| Database | PostgreSQL 16 |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, TanStack Query/Table, Recharts |
| Auth | JWT (Bearer token, localStorage) |
| PDF parsing | pdfplumber |
