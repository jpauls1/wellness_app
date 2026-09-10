import os

# Settings() is constructed at import time in app.database and requires these
# fields; tests never actually connect via app.database's engine (get_session
# is overridden below to use an isolated in-memory SQLite session instead), so
# dummy values are enough to satisfy validation.
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
os.environ.setdefault("CLERK_SECRET_KEY", "sk_test_dummy")

import pytest
from fastapi import Request
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.auth import get_current_user_id
from app.database import get_session
from app.main import app

TEST_USER_ID = "user_test000000000000000000"
OTHER_USER_ID = "user_other00000000000000000"

# Header tests can set to act as a different user on the same TestClient.
# FastAPI's dependency_overrides live on the shared `app` object, so two
# TestClients each overriding get_current_user_id to a fixed value would
# actually clobber each other's override rather than behaving as two users —
# reading the user from a per-request header sidesteps that entirely.
TEST_USER_HEADER = "X-Test-User-Id"


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    def get_current_user_id_override(request: Request) -> str:
        return request.headers.get(TEST_USER_HEADER, TEST_USER_ID)

    app.dependency_overrides[get_session] = get_session_override
    app.dependency_overrides[get_current_user_id] = get_current_user_id_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
