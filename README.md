# TradeLens

A trade journal and analytics platform. Start with Robinhood CSV import.

## Quick Start

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

## Importing trades

1. In Robinhood: Account → Statements & History → Export CSV
2. Open TradeLens → Import tab
3. Select the CSV file and click Import

## Project structure

```
backend/
  app/
    api/v1/endpoints/   # FastAPI route handlers
    models/             # SQLAlchemy ORM models
    schemas/            # Pydantic request/response schemas
    services/           # Trade matching logic
    parsers/            # Broker CSV parsers (robinhood.py, ...)
    core/               # Config
    db/                 # DB engine + session

frontend/
  src/
    pages/              # Dashboard, TradeLog, TradeDetail, ImportPage
    services/api.ts     # Axios API client
    types/index.ts      # Shared TypeScript types
```

## Adding a new broker

1. Add `backend/app/parsers/<broker>.py` — implement `parse_<broker>_csv() -> list[RawExecution]`
2. Add a route in `backend/app/api/v1/endpoints/imports.py`
3. Add an import form variant in the frontend `ImportPage.tsx`
