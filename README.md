# Wellness Tracker

A personal wellness-tracking PWA for iOS: log daily weight and gym workouts, and review progress over time. See [`PRD.md`](PRD.md) for the full product spec and [`DEVELOPMENT_STANDARDS.md`](DEVELOPMENT_STANDARDS.md) for the coding/testing/security conventions this repo follows.

## Stack

- **Backend:** Python 3 + FastAPI + SQLModel + SQLite (`backend/`)
- **Frontend:** React + TypeScript + Vite, installable as an iOS PWA (`frontend/`)

## Prerequisites

- Python 3.11+
- Node.js 20+ / npm

## Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt

uvicorn app.main:app --reload --port 8000
```

- API base URL: `http://localhost:8000/api`
- Interactive docs (Swagger UI): `http://localhost:8000/docs`
- Data is stored in `backend/wellness.db` (SQLite, git-ignored, created automatically on first run).

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
npm run dev
```

- Dev server: `http://localhost:5173`
- API calls to `/api/*` are proxied to `http://127.0.0.1:8000` in dev (see `vite.config.ts`) — start the backend first.

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
    models.py         # SQLModel table definitions
    schemas.py         # Request/response schemas (incl. MM/DD/YY date handling)
    database.py         # SQLite engine + session dependency
    routers/
      weight.py          # /api/weight-entries
      workouts.py          # /api/workouts and nested /api/workouts/{id}/sets
  tests/                    # pytest suite

frontend/
  src/
    api/               # typed fetch client + shared types
    features/
      weight/            # weight logging page + progress line chart
      workouts/            # workout logging, sets, history
    App.tsx               # tab navigation shell
```

## Data model

See [`PRD.md`](PRD.md#5-data-model) for the full entity/field reference. In short: `weight_entries` are standalone timestamped records; `workouts` (name, date, type) each have many `exercise_sets`, where `set_number` auto-increments per exercise type within a workout.
