#!/usr/bin/env bash
# Start the full ClymLens stack for local development:
#   - moto server   (fake S3)            :5000
#   - FastAPI        (uvicorn --reload)   :8000
#   - Vite dev       (React, HMR)         :5173
#
# Usage:  bash scripts/dev.sh
# Stop:   Ctrl-C  (all three are killed)
#
# Prereqs (one-time):
#   backend/   python -m venv .venv && .venv/Scripts/pip install -r requirements-dev.txt && cp .env.example .env
#   frontend/  npm install && echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$ROOT/backend/.venv/Scripts/python.exe" ]; then
  PY="$ROOT/backend/.venv/Scripts/python.exe"       # Windows
else
  PY="$ROOT/backend/.venv/bin/python"               # macOS / Linux
fi

pids=()
cleanup() { echo; echo "stopping..."; for p in "${pids[@]}"; do kill "$p" 2>/dev/null || true; done; }
trap cleanup EXIT INT TERM

echo "→ moto server   http://localhost:5000"
( cd "$ROOT/backend" && "$PY" -m moto.server -p 5000 ) & pids+=($!)
sleep 2

echo "→ FastAPI       http://localhost:8000  (docs at /docs)"
( cd "$ROOT/backend" && "$PY" -m uvicorn app.main:app --reload --port 8000 ) & pids+=($!)
sleep 2

echo "→ Vite          http://localhost:5173"
( cd "$ROOT/frontend" && npm run dev ) & pids+=($!)

wait
