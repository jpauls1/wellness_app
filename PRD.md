# Product Requirements Document: Wellness Tracker PWA

**Status:** Draft
**Owner:** Jeffrey Pauls
**Last updated:** 2026-08-05

## 1. Overview

Wellness Tracker is a personal, single-user Progressive Web App (PWA) for iOS that lets the user log daily weight and gym workouts, and review progress over time through simple historical visualizations. The app is installable to the iOS home screen via Safari and is backed by a lightweight, self-hosted REST API so all history is durable and queryable.

The core value proposition is longitudinal self-tracking: every entry is timestamped and persisted so the user can look back at trends (e.g., "am I losing weight?", "how has my bench press volume changed?") rather than relying on memory or scattered notes.

**Primary user:** a single individual tracking their own wellness journey. Sign-in (Clerk, Google) gates the app and scopes data to the signed-in account, laying groundwork for other people to eventually create their own accounts — but no multi-user features beyond that scoping exist yet (see [Out of Scope](#7-out-of-scope)).

## 2. Functional Requirements

### 2.1 Weight Tracking

| ID | Requirement |
|----|-------------|
| WT-1 | User can create a weight entry at any time (daily or less frequently — no forced cadence). |
| WT-2 | Weight is recorded in pounds (lbs), as a decimal number (e.g., `182.4`). |
| WT-3 | Every weight entry is stored with a server-assigned timestamp (date + time) at creation. The client may optionally supply a timestamp (e.g., for backfilling a missed day); if omitted, the server uses the current time. |
| WT-4 | User can retrieve their full weight history, optionally filtered by date range. |
| WT-5 | User can view a basic line graph plotting weight (lbs, y-axis) against time (x-axis) to visualize progress (loss or gain) over a selected or default range. |
| WT-6 | User can edit or delete a previously logged weight entry (to correct mistakes). |

### 2.2 Workout Tracking

| ID | Requirement |
|----|-------------|
| WK-1 | User can create a **Workout**, which acts as a container for one or more exercise sets performed in a session. |
| WK-2 | A Workout requires: **name** (free text, e.g., "Push Day"), **date** (`MM/DD/YY`), and **type** — one of the enum values: `Lifting`, `Cardio`, `HIIT`, `Yoga`, `Combo`, `Other`. |
| WK-3 | Within a Workout, the user can log one or more **exercise sets**. Each set requires: **exercise type** (free text tag, e.g., "Bench Press"), **set number**, and **reps** (custom integer). |
| WK-4 | **Set number** is not manually entered by the user — the system automatically assigns the next sequential number for that exercise type within the workout (i.e., the 1st logged "Bench Press" set is `1`, the 2nd is `2`, etc.). It is still a required, stored field. |
| WK-5 | Each set optionally captures **time spent**, formatted `HH:MM:SS`. |
| WK-6 | Each set optionally captures **calories burned**, as an integer. |
| WK-7 | Every set is stored with a server-assigned creation timestamp, independent of the workout's `date` field (which represents the calendar day the workout occurred, not the log time). |
| WK-8 | User can retrieve a Workout along with all of its associated sets. |
| WK-9 | User can list all Workouts, optionally filtered by date range and/or type. |
| WK-10 | User can edit or delete a Workout or an individual set within it. |

### 2.3 Cross-Cutting

| ID | Requirement |
|----|-------------|
| GEN-1 | All records (weight entries, workouts, sets) are persisted durably and timestamped, forming an append-first audit trail of the user's history. |
| GEN-2 | All create/read operations are exposed through the REST API described in [Section 4](#4-api-specification). |

## 3. Non-Functional Requirements

- **Lightweight & locally runnable:** The service must start with a single command (given a configured `.env`) and require no infrastructure to self-host beyond a Postgres database (Supabase) and an auth provider (Clerk) — no message queue, no additional services.
- **RESTful conventions:** Resources (`weight-entries`, `workouts`, `sets`) are addressed with plural nouns, standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) map to CRUD actions, and responses use standard HTTP status codes (`200`, `201`, `400`, `404`, etc.).
- **Documented endpoints:** Every endpoint is documented (request/response schema, status codes) both in this PRD and via auto-generated interactive API docs (OpenAPI/Swagger) exposed by the running service.
- **PWA installability on iOS:** The frontend must include a valid `manifest.json` and a service worker so Safari's "Add to Home Screen" produces an app-like, standalone experience with basic offline asset caching. Note: iOS Safari requires the app be served over HTTPS (or accessed on a trusted local network) to install correctly — plain `localhost`-only hosting is sufficient for desktop development but a tunneled/HTTPS URL (e.g., via a reverse proxy or a free hosting tier) is needed to test "Add to Home Screen" on an actual iPhone.
- **Performance:** Given single-user, low-write-volume usage, no specific throughput targets are required beyond sub-200ms typical response times on local hardware.
- **Data durability:** Data is persisted in a managed Postgres database (Supabase), covered by its own backup/point-in-time-recovery tooling.

## 4. API Specification

Base URL (local dev): `http://localhost:8000/api`

All request/response bodies are JSON. Timestamps are ISO 8601 UTC (e.g., `2026-08-05T14:32:10Z`).

### 4.1 Weight Entries

#### `POST /api/weight-entries`
Create a new weight entry.

**Request body:**
```json
{
  "weight_lbs": 182.4,
  "timestamp": "2026-08-05T07:15:00Z"
}
```
`timestamp` is optional; server defaults to current time if omitted.

**Response `201 Created`:**
```json
{
  "id": 42,
  "weight_lbs": 182.4,
  "timestamp": "2026-08-05T07:15:00Z"
}
```

#### `GET /api/weight-entries?from=2026-07-01&to=2026-08-05`
List weight entries, optionally filtered by date range (both params optional).

**Response `200 OK`:**
```json
[
  { "id": 40, "weight_lbs": 184.0, "timestamp": "2026-08-03T07:10:00Z" },
  { "id": 42, "weight_lbs": 182.4, "timestamp": "2026-08-05T07:15:00Z" }
]
```

#### `GET /api/weight-entries/{id}`
Retrieve a single entry. `404` if not found.

#### `PUT /api/weight-entries/{id}`
Update an entry (e.g., correct a mistaken value).

**Request body:**
```json
{ "weight_lbs": 183.0 }
```
**Response:** `200 OK` with the updated entry.

#### `DELETE /api/weight-entries/{id}`
Delete an entry. **Response:** `204 No Content`.

### 4.2 Workouts

#### `POST /api/workouts`
Create a new workout.

**Request body:**
```json
{
  "name": "Push Day",
  "date": "08/05/26",
  "type": "Lifting"
}
```
`type` must be one of: `Lifting`, `Cardio`, `HIIT`, `Yoga`, `Combo`, `Other`.

**Response `201 Created`:**
```json
{
  "id": 7,
  "name": "Push Day",
  "date": "08/05/26",
  "type": "Lifting",
  "created_at": "2026-08-05T18:02:11Z"
}
```

#### `GET /api/workouts?from=2026-07-01&to=2026-08-05&type=Lifting`
List workouts, optionally filtered by date range and/or type.

**Response `200 OK`:**
```json
[
  { "id": 7, "name": "Push Day", "date": "08/05/26", "type": "Lifting", "created_at": "2026-08-05T18:02:11Z" }
]
```

#### `GET /api/workouts/{id}`
Retrieve a workout along with its sets.

**Response `200 OK`:**
```json
{
  "id": 7,
  "name": "Push Day",
  "date": "08/05/26",
  "type": "Lifting",
  "created_at": "2026-08-05T18:02:11Z",
  "sets": [
    {
      "id": 101,
      "exercise_type": "Bench Press",
      "set_number": 1,
      "reps": 10,
      "time_spent": "00:01:15",
      "calories_burned": 20,
      "created_at": "2026-08-05T18:05:00Z"
    },
    {
      "id": 102,
      "exercise_type": "Bench Press",
      "set_number": 2,
      "reps": 8,
      "time_spent": null,
      "calories_burned": null,
      "created_at": "2026-08-05T18:07:30Z"
    }
  ]
}
```

#### `PUT /api/workouts/{id}`
Update a workout's `name`, `date`, and/or `type`.

#### `DELETE /api/workouts/{id}`
Delete a workout and all of its associated sets. **Response:** `204 No Content`.

### 4.3 Exercise Sets (nested under a Workout)

#### `POST /api/workouts/{workout_id}/sets`
Add a set to a workout. `set_number` is computed server-side (next sequential number for `exercise_type` within this workout) and must not be supplied by the client.

**Request body:**
```json
{
  "exercise_type": "Bench Press",
  "reps": 10,
  "time_spent": "00:01:15",
  "calories_burned": 20
}
```
`time_spent` and `calories_burned` are optional; `exercise_type` and `reps` are required.

**Response `201 Created`:**
```json
{
  "id": 101,
  "workout_id": 7,
  "exercise_type": "Bench Press",
  "set_number": 1,
  "reps": 10,
  "time_spent": "00:01:15",
  "calories_burned": 20,
  "created_at": "2026-08-05T18:05:00Z"
}
```

#### `GET /api/workouts/{workout_id}/sets`
List all sets for a workout (also available embedded in `GET /api/workouts/{id}`).

#### `PUT /api/workouts/{workout_id}/sets/{set_id}`
Update a set's `reps`, `time_spent`, or `calories_burned`. `exercise_type` and `set_number` are immutable after creation to preserve sequencing integrity.

#### `DELETE /api/workouts/{workout_id}/sets/{set_id}`
Delete a set. **Response:** `204 No Content`. (Deleting a set does not renumber subsequent sets of the same exercise type — set numbers reflect logging order, not a dense sequence.)

### 4.4 Error Format

All error responses share a common shape:

```json
{
  "error": "validation_error",
  "message": "reps is required and must be a positive integer",
  "field": "reps"
}
```

Standard status codes: `400` (validation), `404` (not found), `422` (semantic validation, e.g., invalid enum value), `500` (server error).

## 5. Data Model

### `weight_entries`

| Field | Type | Constraints |
|---|---|---|
| `id` | integer | primary key, auto-increment |
| `user_id` | text | required, indexed — owning Clerk account, server-assigned from the verified session token |
| `weight_lbs` | decimal | required |
| `timestamp` | datetime | required, defaults to creation time |

### `workouts`

| Field | Type | Constraints |
|---|---|---|
| `id` | integer | primary key, auto-increment |
| `user_id` | text | required, indexed — owning Clerk account, server-assigned from the verified session token |
| `name` | text | required, free text |
| `date` | date | required, stored as `YYYY-MM-DD`, presented as `MM/DD/YY` |
| `type` | enum | required — one of `Lifting`, `Cardio`, `HIIT`, `Yoga`, `Combo`, `Other` |
| `created_at` | datetime | required, server-assigned |

### `exercise_sets`

| Field | Type | Constraints |
|---|---|---|
| `id` | integer | primary key, auto-increment |
| `workout_id` | integer | required, foreign key → `workouts.id` |
| `exercise_type` | text | required, free text tag |
| `set_number` | integer | required, server-assigned; sequential per (`workout_id`, `exercise_type`) |
| `reps` | integer | required, positive |
| `time_spent` | time (`HH:MM:SS`) | optional |
| `calories_burned` | integer | optional, non-negative |
| `created_at` | datetime | required, server-assigned |

**Relationships:** One `workout` has many `exercise_sets` (1:N, cascade delete). `weight_entries` are standalone (no relationship to workouts).

## 6. Technical Stack

| Layer | Choice | Rationale |
|---|---|---|
| Backend language/framework | **Python 3 + FastAPI** | FastAPI generates interactive OpenAPI/Swagger docs automatically from typed request/response models, directly satisfying the "clearly document each endpoint" requirement with minimal effort. It's lightweight, starts with a single `uvicorn` command, and has first-class async support if needed later. |
| ORM / data access | **SQLModel (or SQLAlchemy) + Pydantic validation** | Type-safe models shared between validation and persistence layers; enum support maps cleanly to the `workouts.type` field. |
| Database | **Supabase (managed Postgres)** | Fully relational (foreign keys, joins) for the workout → sets relationship; free tier suits a personal app; managed backups. Replaced an earlier local SQLite file once real auth/accounts were added. |
| Authentication | **Clerk** | Handles sign-in (Google), session tokens, and account management; the backend verifies Clerk session tokens server-side to scope every record to its owning account. |
| Frontend | **React (Vite) as an installable PWA** | Component model suits distinct views (weight log + graph, workout log, workout history); Vite's PWA plugin handles `manifest.json` and service worker generation with minimal config. |
| Charting | **Lightweight charting library (e.g., Chart.js or Recharts)** | Sufficient for the "basic line graph" requirement without heavy dependencies. |
| API docs | **Auto-generated OpenAPI/Swagger UI** (via FastAPI, served at `/docs`) | Satisfies documentation requirement and stays in sync with code automatically. |
| Local dev | `uvicorn main:app --reload` (backend), `npm run dev` (frontend) | Two lightweight commands, no containers or cloud services required to develop. |

## 7. Out of Scope

- Multi-tenant features: invites, roles/permissions, admin tooling, billing. (Authentication itself — Clerk sign-in, per-account data scoping — is in place; sharing the app with other people beyond that is a future step, not built yet.)
- Social features (sharing progress, following other users, leaderboards).
- Integrations with third-party health platforms (Apple Health, Fitbit, Garmin, etc.).
- Push notifications or reminders.
- Nutrition, calorie-intake, or macro tracking.
- Native App Store distribution (iOS PWA via Safari "Add to Home Screen" only).
- Advanced analytics, trend forecasting, or ML-driven insights.
- Bulk data import/export tooling.
- Offline write support with conflict resolution/sync (basic offline asset caching for installability only — data operations require connectivity).
- Renumbering of set numbers after a mid-sequence deletion.
