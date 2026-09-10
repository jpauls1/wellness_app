from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import weight, workouts

settings = get_settings()

app = FastAPI(
    title="Wellness Tracker API",
    description="REST API for tracking daily weight and gym workouts.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weight.router)
app.include_router(workouts.router)


@app.get("/api/health", tags=["health"])
def health_check() -> dict:
    return {"status": "ok"}
