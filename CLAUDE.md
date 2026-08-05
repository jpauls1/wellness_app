# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A personal wellness-tracking PWA for iOS (weight + gym workout logging with progress charts). Full product spec: `PRD.md`. Coding/testing/security conventions: `DEVELOPMENT_STANDARDS.md`. Two independent apps in one repo, no shared tooling between them:

- `backend/` — FastAPI + SQLModel + SQLite REST API
- `frontend/` — React + TypeScript + Vite PWA

## Commands

### Backend (`backend/`)

```bash
python3 -m venv .venv && source .venv/bin/activate   # first time only
pip install -r requirements-dev.txt                   # first time / after dep changes

uvicorn app.main:app --reload --port 8000              # run the API (http://localhost:8000, docs at /docs)

pytest                                                    # run all tests
pytest tests/test_workouts.py::test_set_numbers_auto_increment_per_exercise_type  # single test
```

`backend/wellness.db` (SQLite) is created automatically on first run and is git-ignored — delete it to reset all data.

### Frontend (`frontend/`)

```bash
npm install         # first time / after dep changes

npm run dev          # dev server at http://localhost:5173, proxies /api/* to backend on :8000
npm run build          # tsc -b type-check, then vite build (also generates the PWA service worker/manifest)
npm run lint             # oxlint
npm run preview            # serve the production build locally
```

The backend must be running on port 8000 for `npm run dev` to have working API calls (see proxy config in `vite.config.ts`).

## Architecture

### Backend request flow

`app/main.py` wires everything together: CORS is wide open (frontend and backend are separate origins in dev), and the `lifespan` hook calls `create_db_and_tables()` on startup. Two routers are mounted: `app/routers/weight.py` (`/api/weight-entries`) and `app/routers/workouts.py` (`/api/workouts`, including the nested `/api/workouts/{id}/sets` routes — workouts and sets share one router file because sets can't exist without a parent workout).

`app/database.py` holds a single module-level SQLite `engine`; `get_session()` is a FastAPI dependency yielding one `Session` per request. Tests override this dependency (see below) rather than hitting the real `wellness.db`.

**Models vs. schemas are deliberately separate** (`app/models.py` vs. `app/schemas.py`). `models.py` has the SQLModel table classes using native Python `date`/`time` types. `schemas.py` has the Pydantic request/response shapes — notably, the API contract represents `Workout.date` as an `MM/DD/YY` string (per the PRD), so `schemas.py` owns `parse_mmddyy`/`format_mmddyy` and a `WorkoutRead.serialize_date` field serializer to convert at the boundary. Routers always convert through these helpers rather than passing raw strings to the DB layer.

**Set numbers are server-authoritative, not client input.** `ExerciseSetCreate` has no `set_number` field. `routers/workouts.py::create_set` computes it by querying `max(ExerciseSet.set_number)` scoped to `(workout_id, exercise_type)` and incrementing — so "Bench Press" and "Squat" within the same workout each have their own independent 1, 2, 3… sequence. Deleting a set does not renumber the rest (numbers reflect logging order, not a dense sequence).

### Frontend structure

No router library and no global state manager — `App.tsx` is a two-tab switcher (`WeightPage` / `WorkoutsPage`) using local `useState`, and each feature page fetches its own data in a `useEffect`. Code is organized by feature, not by type:

- `src/api/client.ts` — single typed `api` object wrapping `fetch`; all calls go to relative `/api/...` paths (proxied to the backend in dev via `vite.config.ts`, same-origin in a combined prod deployment).
- `src/api/types.ts` — TypeScript types mirroring the backend Pydantic schemas, including the `WorkoutType` enum values.
- `src/features/weight/` — `WeightPage` (form + history list) and `WeightChart` (Chart.js line chart of weight over time).
- `src/features/workouts/` — `WorkoutsPage` (create form + history list) and `WorkoutDetail` (fetches one workout with its sets, handles add/delete of sets).
- `src/utils/date.ts` — bridges the two date formats in play: HTML `<input type="date">` produces `YYYY-MM-DD`, but the backend contract is `MM/DD/YY`; `isoToMmDdYy` converts before every workout create/update call.

### PWA setup

`vite-plugin-pwa` is configured inline in `vite.config.ts` (manifest fields, icons, `registerType: 'autoUpdate'`) rather than a static `manifest.json` file. `src/main.tsx` calls `registerSW()` from the `virtual:pwa-register` module on startup. Icons in `public/icons/` are placeholder PNGs (generated programmatically, not designed assets) — swap them for real branding before shipping. iOS Safari requires HTTPS to allow "Add to Home Screen"; plain `localhost` only works for desktop dev.

### Backend tests

`backend/tests/conftest.py` overrides the `get_session` dependency with an in-memory SQLite database (`StaticPool`, fresh per test function via the `session` fixture), so tests never touch `wellness.db` and are fully isolated from each other. `pytest.ini` sets `pythonpath = .` so `from app...` imports resolve when running `pytest` from `backend/`.
