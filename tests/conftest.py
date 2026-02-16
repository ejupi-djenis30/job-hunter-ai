"""
Shared test fixtures and configuration.
"""

import os
import sys
import pytest
from pathlib import Path

# Ensure project root is on sys.path for imports
PROJECT_ROOT = Path(__file__).parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Set required env vars BEFORE any backend imports
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_job_hunter.db")


# ─── Pytest Markers ───

def pytest_addoption(parser):
    """Add custom CLI options."""
    parser.addoption(
        "--run-live",
        action="store_true",
        default=False,
        help="Run live integration tests against real APIs",
    )


def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line("markers", "live: marks tests requiring live API access")
    config.addinivalue_line("markers", "slow: marks tests as slow-running")


def pytest_collection_modifyitems(config, items):
    """Skip live tests unless --run-live is passed."""
    if not config.getoption("--run-live"):
        skip_live = pytest.mark.skip(reason="Need --run-live option to run")
        for item in items:
            if "live" in item.keywords:
                item.add_marker(skip_live)


# ─── Database Fixtures ───

@pytest.fixture(scope="session")
def test_db_path(tmp_path_factory):
    """Create a temporary database path for tests."""
    return tmp_path_factory.mktemp("data") / "test.db"


@pytest.fixture(scope="session")
def test_engine(test_db_path):
    """Create a test database engine."""
    from sqlalchemy import create_engine
    engine = create_engine(
        f"sqlite:///{test_db_path}",
        connect_args={"check_same_thread": False},
    )

    from backend.db.base import Base
    import backend.models  # Ensure models are registered
    Base.metadata.create_all(bind=engine)

    yield engine

    engine.dispose()


@pytest.fixture
def db_session(test_engine):
    """Create a fresh database session for each test."""
    from sqlalchemy.orm import sessionmaker

    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestSession()

    yield session

    session.rollback()
    session.close()


# ─── FastAPI Test Client ───

@pytest.fixture
def client(test_engine, db_session):
    """Create a FastAPI test client with injected test DB."""
    from fastapi.testclient import TestClient
    from backend.main import app
    from backend.db.base import get_db

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
