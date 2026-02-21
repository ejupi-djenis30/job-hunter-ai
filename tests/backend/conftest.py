import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.main import app
from backend.db.base import Base, get_db
from backend.models import User
from backend.services.auth import get_password_hash

# Setup Testing Database (In-Memory SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="session")
def client(setup_database):
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="session")
def db_session(setup_database):
    session = TestingSessionLocal()
    yield session
    session.close()

@pytest.fixture(scope="session")
def test_user(db_session):
    user = User(
        username="globaladmin",
        hashed_password=get_password_hash("Globalpass1")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    yield user

@pytest.fixture(scope="session")
def auth_headers(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "globaladmin", "password": "Globalpass1"}
    )
    token = response.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}
