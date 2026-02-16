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
# 1. Role-Based Login
# ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_signup_and_login_with_role(client: AsyncClient):
    """Signup as candidate, then login with role=candidate."""
    signup = await client.post("/api/v1/auth/signup", json=make_candidate_payload(
        "roletest@test.com", password="pass123", role="candidate"
    ))
    assert signup.status_code == 200

    login = await client.post(
        "/api/v1/auth/login/access-token?role=candidate",
        data={"username": "roletest@test.com", "password": "pass123"}
    )
    assert login.status_code == 200
    assert "access_token" in login.json()


@pytest.mark.asyncio
async def test_same_email_different_roles(client: AsyncClient):
    """Same email can be registered under different roles."""
    # Register as candidate
    r1 = await client.post("/api/v1/auth/signup", json=make_candidate_payload(
        "multirole@test.com", password="pass123", role="candidate"
    ))
    assert r1.status_code == 200

    # Register same email as client (client role doesn't require candidate fields)
    from tests.conftest import make_client_payload
    r2 = await client.post("/api/v1/auth/signup", json=make_client_payload(
        "multirole@test.com", password="pass456"
    ))
    assert r2.status_code == 200

    # Login as candidate
    login_candidate = await client.post(
        "/api/v1/auth/login/access-token?role=candidate",
        data={"username": "multirole@test.com", "password": "pass123"}
    )
    assert login_candidate.status_code == 200

    # Login as client
    login_client = await client.post(
        "/api/v1/auth/login/access-token?role=client",
        data={"username": "multirole@test.com", "password": "pass456"}
    )
    assert login_client.status_code == 200


@pytest.mark.asyncio
async def test_duplicate_email_same_role_fails(client: AsyncClient):
    """Cannot register the same email+role combination twice."""
    await client.post("/api/v1/auth/signup", json=make_candidate_payload(
        "duptest@test.com", password="pass123", role="candidate"
    ))
    r2 = await client.post("/api/v1/auth/signup", json=make_candidate_payload(
        "duptest@test.com", password="pass456", role="candidate"
    ))
    assert r2.status_code == 400


@pytest.mark.asyncio
async def test_login_wrong_role_fails(client: AsyncClient):
    """Login with wrong role should fail."""
    await client.post("/api/v1/auth/signup", json=make_candidate_payload(
        "wrongrole@test.com", password="pass123", role="candidate"
    ))
    login = await client.post(
        "/api/v1/auth/login/access-token?role=admin",
        data={"username": "wrongrole@test.com", "password": "pass123"}
    )
    assert login.status_code == 400


@pytest.mark.asyncio
async def test_login_wrong_password_fails(client: AsyncClient):
    """Login with wrong password should fail."""
    await client.post("/api/v1/auth/signup", json=make_candidate_payload(
        "badpass@test.com", password="correctpass", role="candidate"
    ))
    login = await client.post(
        "/api/v1/auth/login/access-token?role=candidate",
        data={"username": "badpass@test.com", "password": "wrongpass"}
    )
    assert login.status_code == 400


@pytest.mark.asyncio
async def test_reset_password(client: AsyncClient):
    """Reset password generates a temp password (emailed or returned in dev mode)."""
    await client.post("/api/v1/auth/signup", json=make_candidate_payload(
        "resetme@test.com", password="oldpass123", role="candidate"
    ))

    reset = await client.post("/api/v1/auth/reset-password", json={
        "email": "resetme@test.com",
        "role": "candidate"
    })
    assert reset.status_code == 200
    data = reset.json()
    assert "message" in data

    # If SMTP is not configured (dev mode), temp password is returned
    if "temporary_password" in data:
        temp_password = data["temporary_password"]
        assert len(temp_password) == 8
        login = await client.post(
            "/api/v1/auth/login/access-token?role=candidate",
            data={"username": "resetme@test.com", "password": temp_password}
        )
        assert login.status_code == 200


@pytest.mark.asyncio
async def test_reset_password_nonexistent(client: AsyncClient):
    """Reset password for non-existent email+role returns 404."""
    reset = await client.post("/api/v1/auth/reset-password", json={
        "email": "ghost@test.com",
        "role": "candidate"
    })
    assert reset.status_code == 404
    assert reset.status_code == 404


# ───────────────────────────────────────────────────
# 2. Client Profile Enhancement Tests
# ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_signup_client_success(client: AsyncClient):
    """Client signup with valid company_name and designation succeeds."""
    from tests.conftest import make_client_payload
    
    payload = make_client_payload("client_success@test.com")
    response = await client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]


@pytest.mark.asyncio
async def test_signup_client_missing_fields(client: AsyncClient):
    """Client signup fails if company_name or designation is missing."""
    from tests.conftest import make_client_payload
    
    # Missing company_name
    payload = make_client_payload("client_fail1@test.com")
    del payload["company_name"]
    response = await client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 422

    # Missing designation
    payload = make_client_payload("client_fail2@test.com")
    del payload["designation"]
    response = await client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_signup_candidate_missing_fields(client: AsyncClient):
    """Candidate signup fails if years_of_experience or work_permit_type is missing."""
    # Missing years_of_experience
    payload = make_candidate_payload("cand_fail1@test.com", "candidate")
    del payload["years_of_experience"]
    response = await client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 422

    # Missing work_permit_type
    payload = make_candidate_payload("cand_fail2@test.com", "candidate")
    del payload["work_permit_type"]
    response = await client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 422
