#!/usr/bin/env bash
# dev.sh — start all TradeLens components in one command
#
# Usage:  ./dev.sh
# Stops:  Ctrl+C  (kills backend + frontend; stops DB container)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

BACKEND_PORT=8000
FRONTEND_PORT=5173

# PIDs we need to clean up
PIDS=()

# ── Colours ────────────────────────────────────────────────────────────────────
C_RESET='\033[0m'
C_BOLD='\033[1m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_BLUE='\033[0;34m'
C_RED='\033[0;31m'
C_CYAN='\033[0;36m'

log()  { echo -e "${C_BOLD}[dev]${C_RESET} $*"; }
ok()   { echo -e "${C_GREEN}[ok]${C_RESET} $*"; }
warn() { echo -e "${C_YELLOW}[!]${C_RESET} $*"; }
err()  { echo -e "${C_RED}[x]${C_RESET} $*"; }

# ── Cleanup on exit ─────────────────────────────────────────────────────────
cleanup() {
  echo ""
  log "Shutting down..."

  for pid in "${PIDS[@]+"${PIDS[@]}"}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done

  # Wait for children to exit
  wait 2>/dev/null || true

  log "Stopping database container..."
  docker compose -f "$ROOT/docker-compose.yml" stop 2>/dev/null || true

  ok "All services stopped."
}
trap cleanup EXIT INT TERM

# ── Preflight checks ─────────────────────────────────────────────────────────
log "Checking dependencies..."

for cmd in docker python3 node npm; do
  if ! command -v "$cmd" &>/dev/null; then
    err "'$cmd' not found — please install it first."
    exit 1
  fi
done

if ! docker info &>/dev/null; then
  err "Docker is not running. Start Docker Desktop and retry."
  exit 1
fi

ok "Dependencies OK"

# ── Port conflict checks ─────────────────────────────────────────────────────
for port in 5432 $BACKEND_PORT $FRONTEND_PORT; do
  if lsof -ti tcp:"$port" &>/dev/null; then
    warn "Port $port is already in use — skipping check (process may already be running)"
  fi
done

# ── 1. Database ──────────────────────────────────────────────────────────────
log "Starting PostgreSQL..."
docker compose -f "$ROOT/docker-compose.yml" up -d 2>&1 | grep -v "^$" || true

# Wait until postgres is ready to accept connections
log "Waiting for PostgreSQL to be ready..."
for i in $(seq 1 20); do
  if docker compose -f "$ROOT/docker-compose.yml" exec -T db \
      pg_isready -U tradelens -d tradelens &>/dev/null; then
    ok "PostgreSQL ready"
    break
  fi
  if [ "$i" -eq 20 ]; then
    err "PostgreSQL did not become ready in time."
    exit 1
  fi
  sleep 1
done

# ── 2. Migrations ────────────────────────────────────────────────────────────
log "Running database migrations..."
(cd "$BACKEND" && alembic upgrade head 2>&1) | sed 's/^/  [alembic] /'
ok "Migrations up to date"

# ── 3. Backend ───────────────────────────────────────────────────────────────
log "Starting backend on :$BACKEND_PORT..."
(
  cd "$BACKEND"
  uvicorn app.main:app \
    --host 127.0.0.1 \
    --port "$BACKEND_PORT" \
    --reload \
    --log-level info 2>&1
) | sed $'s/^/\033[0;34m[backend]\033[0m /' &
BACKEND_PID=$!
PIDS+=($BACKEND_PID)

# Wait for backend to be accepting requests
log "Waiting for backend to be ready..."
for i in $(seq 1 20); do
  if curl -sf "http://127.0.0.1:$BACKEND_PORT/health" &>/dev/null; then
    ok "Backend ready → http://localhost:$BACKEND_PORT"
    ok "API docs   → http://localhost:$BACKEND_PORT/docs"
    break
  fi
  if [ "$i" -eq 20 ]; then
    err "Backend did not start in time."
    exit 1
  fi
  sleep 1
done

# ── 4. Frontend ──────────────────────────────────────────────────────────────
log "Installing frontend dependencies (if needed)..."
(cd "$FRONTEND" && npm install --silent 2>&1) | tail -2

log "Starting frontend on :$FRONTEND_PORT..."
(
  cd "$FRONTEND"
  npm run dev -- --port "$FRONTEND_PORT" 2>&1
) | sed $'s/^/\033[0;36m[frontend]\033[0m /' &
PIDS+=($!)

# Wait for frontend to respond
log "Waiting for frontend to be ready..."
for i in $(seq 1 20); do
  if curl -sf "http://localhost:$FRONTEND_PORT" &>/dev/null; then
    ok "Frontend ready → http://localhost:$FRONTEND_PORT"
    break
  fi
  if [ "$i" -eq 20 ]; then
    err "Frontend did not start in time."
    exit 1
  fi
  sleep 1
done

# ── Ready ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${C_GREEN}${C_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
echo -e "${C_GREEN}${C_BOLD}  TradeLens is running${C_RESET}"
echo -e "${C_GREEN}${C_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
echo -e "  ${C_CYAN}App${C_RESET}      http://localhost:$FRONTEND_PORT"
echo -e "  ${C_BLUE}API docs${C_RESET} http://localhost:$BACKEND_PORT/docs"
echo -e "  ${C_YELLOW}DB${C_RESET}       localhost:5432  (tradelens/tradelens)"
echo ""
echo -e "  Press ${C_BOLD}Ctrl+C${C_RESET} to stop all services."
echo ""

# Keep script alive and stream logs from both processes
wait
