# TradeLens — Backend

FastAPI + SQLAlchemy 2 (async) + Alembic. Runs on Fly.io in production.

## Structure

```
app/
  api/v1/endpoints/   # Route handlers: accounts, trades, imports, analytics
  models/             # SQLAlchemy ORM models (User, Account, Trade, Execution, ImportLog)
  schemas/            # Pydantic request/response schemas
  services/           # FIFO trade matcher, contract specs, import logic
  parsers/            # PDF/CSV parsers: rh_futures_pdf, rh_nonfutures_pdf, robinhood
  core/               # Config (pydantic-settings), JWT auth (fastapi-users)
  db/                 # Async engine + session dependency
alembic/              # Database migrations
tests/                # pytest test suite
Dockerfile            # Production Docker image
requirements.txt      # pip dependencies (used by Docker)
pyproject.toml        # Poetry config (used locally)
```

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | local postgres | asyncpg connection string, e.g. `postgresql+asyncpg://user:pass@host/db?ssl=require` |
| `SECRET_KEY` | Yes | `changeme-...` | Random hex string for JWT signing — generate with `openssl rand -hex 32` |
| `CORS_ORIGINS` | Yes | `http://localhost:5173` | Comma-separated list of allowed origins, e.g. `https://tradelens-brown.vercel.app,http://localhost:5173` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `10080` (7 days) | JWT expiry in minutes |

For local development, create `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://tradelens:tradelens@localhost:5432/tradelens
SECRET_KEY=any-local-secret
CORS_ORIGINS=http://localhost:5173
```

---

## Local development

```bash
cd backend
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --port 8000
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs

---

## Migrations

```bash
# Apply all pending migrations
poetry run alembic upgrade head

# Create a new migration after changing a model
poetry run alembic revision --autogenerate -m "description"

# Roll back one step
poetry run alembic downgrade -1
```

Migrations run automatically on startup in production (see `Dockerfile` CMD).

---

## Running tests

```bash
cd backend
poetry run pytest tests/ -v
```

---

## Production deployment (Fly.io)

### First-time setup

```bash
# Install flyctl
brew install flyctl
fly auth login

# Create the app (run from repo root)
fly launch --name tradelens-api --region ord --no-deploy
# Answer NO to creating a Postgres database (we use Neon)
# Answer NO to deploying now

# Set secrets
fly secrets set \
  DATABASE_URL="postgresql+asyncpg://user:pass@host/db?ssl=require" \
  SECRET_KEY="$(openssl rand -hex 32)" \
  CORS_ORIGINS="https://your-frontend.vercel.app,http://localhost:5173"

# Deploy
fly deploy
```

### Subsequent deploys

```bash
fly deploy
```

Or push to `main` and set up auto-deploy via the Fly.io dashboard → GitHub integration.

### Useful commands

```bash
fly logs                        # Stream live logs
fly ssh console                 # SSH into the running machine
fly secrets list                # List secret names (not values)
fly secrets set KEY=value       # Update a secret (triggers redeploy)
fly status                      # Machine and deployment status
```

### Configuration

See `fly.toml` in the repo root. Key settings:

- `auto_stop_machines = "stop"` — machine stops when idle (free tier friendly)
- `auto_start_machines = true` — wakes on incoming request
- `min_machines_running = 0` — fully stops when idle; first request after idle takes ~2s to wake
- `memory = "256mb"` — sufficient for FastAPI + pdfplumber

### Docker build

The `Dockerfile` at `backend/Dockerfile` is the production image. The Fly.io build context is the **repo root** so paths are relative to the root (e.g. `COPY backend/requirements.txt .`).

To build and test locally:

```bash
docker build -f backend/Dockerfile -t tradelens-api .
docker run -p 8080:8080 \
  -e DATABASE_URL="..." \
  -e SECRET_KEY="test" \
  -e CORS_ORIGINS="http://localhost:5173" \
  tradelens-api
```
