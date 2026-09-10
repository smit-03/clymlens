# ClymLens

A small full-stack **weather explorer**: fetch historical daily weather for a location and
date range from the [Open-Meteo](https://open-meteo.com/) archive API, store the raw JSON in
Amazon S3, and browse / visualize it from a web dashboard.

- **Backend:** Python 3.12 · FastAPI · deployed to AWS Lambda (Function URL)
- **Frontend:** React 18 · TypeScript · Tailwind CSS · Vite · deployed to Vercel
- **Storage:** Amazon S3 (one raw JSON object per fetch)

> Design and implementation spec: [`docs/DESIGN.md`](docs/DESIGN.md).

## Live demo

| | URL | Last verified live |
|---|---|---|
| Dashboard | _to be added (M9)_ | _pending_ |
| API health | _to be added (M9)_ | _pending_ |

## Repository layout

```
backend/    FastAPI app, tests, AWS SAM template
frontend/   React + Tailwind dashboard
docs/       DESIGN.md
```

## Prerequisites

- Python 3.12+ and `pip`
- Node.js 22+ and `npm`
- An AWS account with S3 access (for running against real storage / deploying)

## Backend — local

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows
# source .venv/bin/activate   # macOS / Linux
pip install -r requirements-dev.txt
cp .env.example .env          # then edit S3_BUCKET etc.
uvicorn app.main:app --reload --port 8000
```

Check it: `curl http://localhost:8000/health`

### Backend tests

```bash
cd backend
pytest -q
ruff check .
black --check .
```

## Frontend — local

```bash
cd frontend
npm install
cp .env.example .env.local    # set VITE_API_BASE_URL=http://localhost:8000
npm run dev                    # http://localhost:5173
```

### Frontend tests

```bash
cd frontend
npm test
npm run typecheck
npm run build
```

## Environment variables

Backend — see [`backend/.env.example`](backend/.env.example). Frontend — see
[`frontend/.env.example`](frontend/.env.example).

## Deployment

See [`docs/DESIGN.md` §10](docs/DESIGN.md). Summary: backend via AWS SAM to Lambda + Function
URL; frontend to Vercel with `VITE_API_BASE_URL` pointed at the Function URL. Detailed,
verified steps are added in milestone M9.

## Assumptions & decisions

- "Date range ≤ 31 days" is interpreted as **at most 31 distinct calendar days**
  (`end_date - start_date ≤ 30 days`).
- The dashboard visualizes **stored** S3 files only; Open-Meteo is called at most once per
  distinct query (short-lived de-duplication).
- Full rationale for architecture, security, and cost choices is in `docs/DESIGN.md`.

## Cost

Designed for AWS **free tier only** (S3, Lambda, IAM, CloudWatch Logs). See
[`docs/DESIGN.md` §9](docs/DESIGN.md) for the specifics and the safeguards against accidental
spend.
