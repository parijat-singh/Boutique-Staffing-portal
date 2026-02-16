import pytest
from httpx import AsyncClient
from tests.conftest import make_candidate_payload


async def get_auth_headers(client: AsyncClient, email: str, role: str):
    """Register a user and return auth headers."""
    await client.post("/api/v1/auth/signup", json=make_candidate_payload(email, role=role))
    login_response = await client.post(
        f"/api/v1/auth/login/access-token?role={role}",
        data={"username": email, "password": "password123"}
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ───────────────────────────────────────────────────
# 1. Profile Read (GET /users/me)
# ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_my_profile(client: AsyncClient):
    """Authenticated user can read their own profile."""
    headers = await get_auth_headers(client, "profile_read@test.com", "candidate")
    response = await client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "profile_read@test.com"
    assert data["role"].lower() == "candidate"


# ───────────────────────────────────────────────────
# 2. Profile Update (PUT /users/me)
# ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_profile_identity(client: AsyncClient):
    """Candidate can update first name, middle initial, last name."""
    headers = await get_auth_headers(client, "profile_identity@test.com", "candidate")

    response = await client.put("/api/v1/users/me", json={
        "first_name": "Jane",
        "middle_initial": "M",
        "last_name": "Doe",
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Jane"
    assert data["middle_initial"] == "M"
    assert data["last_name"] == "Doe"


@pytest.mark.asyncio
async def test_update_profile_contact(client: AsyncClient):
    """Candidate can update phone number."""
    headers = await get_auth_headers(client, "profile_contact@test.com", "candidate")

    response = await client.put("/api/v1/users/me", json={
        "phone_number": "555-123-4567",
    }, headers=headers)
    assert response.status_code == 200
    assert response.json()["phone_number"] == "555-123-4567"


@pytest.mark.asyncio
async def test_update_profile_professional(client: AsyncClient):
    """Candidate can update professional data fields."""
    headers = await get_auth_headers(client, "profile_pro@test.com", "candidate")

    response = await client.put("/api/v1/users/me", json={
        "years_of_experience": 5,
        "work_permit_type": "H1B",
        "city": "San Francisco",
        "state": "CA",
        "linkedin_url": "https://linkedin.com/in/janetest",
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["years_of_experience"] == 5
    assert data["work_permit_type"] == "H1B"
    assert data["city"] == "San Francisco"
    assert data["state"] == "CA"
    assert data["linkedin_url"] == "https://linkedin.com/in/janetest"


@pytest.mark.asyncio
async def test_update_profile_password(client: AsyncClient):
    """Candidate can update password, then login with new password."""
    headers = await get_auth_headers(client, "profile_pass@test.com", "candidate")

    # Change password
    response = await client.put("/api/v1/users/me", json={
        "password": "newpassword123",
    }, headers=headers)
    assert response.status_code == 200

    # Login with new password
    login = await client.post(
        "/api/v1/auth/login/access-token?role=candidate",
        data={"username": "profile_pass@test.com", "password": "newpassword123"}
    )
    assert login.status_code == 200
    assert "access_token" in login.json()


@pytest.mark.asyncio
async def test_update_profile_preserves_other_fields(client: AsyncClient):
    """Updating one field does not clear others."""
    headers = await get_auth_headers(client, "profile_preserve@test.com", "candidate")

    # Set first name
    await client.put("/api/v1/users/me", json={"first_name": "Alice"}, headers=headers)

    # Set city (should not clear first_name)
    response = await client.put("/api/v1/users/me", json={"city": "Denver"}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Alice"
    assert data["city"] == "Denver"


@pytest.mark.asyncio
async def test_unauthenticated_profile_access(client: AsyncClient):
    """Unauthenticated requests to /users/me should fail."""
    response = await client.get("/api/v1/users/me")
    assert response.status_code in [401, 403]
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
async def test_update_client_profile(client: AsyncClient):
    """Client can update company_name and designation."""
    from tests.conftest import make_client_payload
    
    # Signup as client
    email = "client_update@test.com"
    await client.post("/api/v1/auth/signup", json=make_client_payload(email))
    
    # Login
    login_response = await client.post(
        "/api/v1/auth/login/access-token?role=client",
        data={"username": email, "password": "password123"}
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Update profile
    response = await client.put("/api/v1/users/me", json={
        "company_name": "New Corp Ltd",
        "designation": "Director",
    }, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["company_name"] == "New Corp Ltd"
    assert data["designation"] == "Director"
    assert data["role"] == "client"
