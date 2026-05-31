# TradeLens

A trade journal and analytics platform for active traders. Import your Robinhood statements, visualise P&L, and track performance metrics.

## Live deployment

| Service | URL |
|---|---|
| Frontend | https://tradelens-brown.vercel.app |
| Backend API | https://tradelens-api.fly.dev |
| API docs | https://tradelens-api.fly.dev/docs |

---

## Quick start (local)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Python 3.12+ with [Poetry](https://python-poetry.org/)
- Node.js 18+

### One-command startup

```bash
./dev.sh
```

The script will:

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

## Deploying to production

The production stack is **Vercel (frontend) + Fly.io (backend) + Neon (database)** — all free tier with a credit card on file.

See the service-specific guides:
- **[`backend/README.md`](backend/README.md)** — Fly.io deploy, environment variables, migrations
- **[`frontend/README.md`](frontend/README.md)** — Vercel deploy, environment variables

---

## Importing trades

TradeLens supports three Robinhood import formats:

| Format | Where to get it |
|---|---|
| **Futures PDF** (daily or monthly) | Robinhood → Account → Statements → Futures confirmations |
| **Non-futures PDF** (monthly) | Robinhood → Account → Statements → Monthly statement |
| **CSV** | Robinhood → Account → Statements & History → Export CSV |

Upload via the **Import** page. Duplicate uploads are detected automatically (SHA-256 deduplication).

Free tier allows **5 imports total** per account.

---

## Project structure

```
backend/          # FastAPI + SQLAlchemy + Alembic
frontend/         # React 18 + Vite + TailwindCSS
docker-compose.yml  # Local PostgreSQL
fly.toml          # Fly.io backend config
dev.sh            # One-command local startup
```

See the sub-READMEs for full internal structure.

---

## Adding a new broker

1. Add `backend/app/parsers/<broker>.py` — implement `parse_<broker>() -> list[RawExecution]`
2. Add a route in `backend/app/api/v1/endpoints/imports.py`
3. Add an import card in `frontend/src/pages/ImportPage.tsx`

---

## Tech stack

| Layer | Stack |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 (async), Alembic, fastapi-users |
| Database | PostgreSQL (Neon in prod, Docker locally) |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, TanStack Query/Table, Recharts |
| Auth | JWT (Bearer token, localStorage) |
| PDF parsing | pdfplumber |
| Hosting | Vercel (frontend), Fly.io (backend), Neon (database) |
