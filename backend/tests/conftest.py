import asyncio
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.api.deps import get_db
from app.core.config import settings

# Use an in-memory SQLite database for testing or a separate test DB
# For simplicity with async, we use the same DB but ideally should use a test DB.
# WARNING: This might wipe data if we aren't careful. 
# Better to use a separate test.db
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session

@pytest.fixture
async def client(db_session) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


def make_candidate_payload(email: str, password: str = "password123", role: str = "candidate", **overrides):
    """Build a valid signup payload with all required fields."""
    base = {
        "email": email,
        "password": password,
        "role": role,
        "first_name": "Test",
        "last_name": "User",
        "phone_number": "5551234567",
        "years_of_experience": 3,
        "work_permit_type": "US Citizen",
        "linkedin_url": "https://linkedin.com/in/testuser",
    }
    base.update(overrides)
    return base


def make_client_payload(email: str, password: str = "password123", **overrides):
    """Build a valid client signup payload."""
    base = {
        "email": email,
        "password": password,
        "role": "client",
        "first_name": "Client",
        "last_name": "User",
        "phone_number": "5559876543",
        "company_name": "Test Corp",
        "designation": "Hiring Manager",
    }
    base.update(overrides)
    return base
