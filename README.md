# Wellness Tracker

A wellness-tracking PWA for iOS: log daily weight and gym workouts, and review progress over time. Sign-in via Clerk (Google), data stored in Supabase Postgres. See [`PRD.md`](PRD.md) for the full product spec and [`DEVELOPMENT_STANDARDS.md`](DEVELOPMENT_STANDARDS.md) for the coding/testing/security conventions this repo follows.

## Stack

- **Backend:** Python 3 + FastAPI + SQLModel + Supabase Postgres, Clerk for auth (`backend/`)
- **Frontend:** React + TypeScript + Vite, installable as an iOS PWA, Clerk for sign-in (`frontend/`)

## Prerequisites

- Python 3.11+
- Node.js 20+ / npm
- A Clerk application (Google sign-in enabled) and a Supabase project

## Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt

cp .env.example .env   # fill in DATABASE_URL (Supabase session pooler) and CLERK_SECRET_KEY
alembic upgrade head   # create tables (first run only, or after a schema change)

uvicorn app.main:app --reload --port 8000
```

- API base URL: `http://localhost:8000/api`
- Interactive docs (Swagger UI): `http://localhost:8000/docs`
- Data lives in Supabase Postgres — see `backend/.env.example` for the required connection string shape.

Run the test suite:

```bash
cd backend
source .venv/bin/activate
pytest
```

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # fill in VITE_CLERK_PUBLISHABLE_KEY
npm run dev
```

- Dev server: `http://localhost:5173`
- API calls to `/api/*` are proxied to `http://127.0.0.1:8000` in dev (see `vite.config.ts`) — start the backend first.
- Sign-in is required to use the app (Clerk, Google connection).

Other commands:

```bash
npm run build    # type-check and build for production (dist/)
npm run lint     # oxlint
npm run preview  # serve the production build locally
```

### Installing on iOS

Safari requires HTTPS (or a trusted local network origin) to allow "Add to Home Screen" for a PWA — plain `localhost` works for development in a desktop browser, but to test the install flow on an iPhone you'll need to serve the built app over HTTPS (e.g. a tunneling tool or a free hosting tier) and open that URL in Safari.

## Project structure

```
backend/
  app/
    main.py          # FastAPI app, CORS, router registration
    models.py         # SQLModel table definitions (weight/workout rows carry user_id)
    schemas.py         # Request/response schemas (incl. MM/DD/YY date handling)
    database.py         # Supabase Postgres engine + session dependency
    config.py            # Settings loaded from .env (DATABASE_URL, CLERK_SECRET_KEY, ...)
    auth.py               # Clerk session-token verification -> current user id
    routers/
      weight.py          # /api/weight-entries (scoped to the authenticated user)
      workouts.py          # /api/workouts and nested /api/workouts/{id}/sets (same)
  alembic/                  # schema migrations
  tests/                    # pytest suite

frontend/
  src/
    api/               # typed fetch client (attaches Clerk bearer token) + shared types
    features/
      weight/            # weight logging page + progress line chart
      workouts/            # workout logging, sets, history
    App.tsx               # sign-in gating (Clerk) + tab navigation shell
```

## Data model

See [`PRD.md`](PRD.md#5-data-model) for the full entity/field reference. In short: `weight_entries` are standalone timestamped records; `workouts` (name, date, type) each have many `exercise_sets`, where `set_number` auto-increments per exercise type within a workout.
