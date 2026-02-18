import pytest
from httpx import AsyncClient
from app.core.security import create_access_token
from tests.conftest import make_candidate_payload, make_client_payload


async def get_auth_headers(client: AsyncClient, email: str, role: str):
    """Register a user and return auth headers."""
    if role == "client":
        payload = make_client_payload(email)
    else:
        payload = make_candidate_payload(email, role=role)
        
    await client.post("/api/v1/auth/signup", json=payload)
    login_response = await client.post(
        f"/api/v1/auth/login/access-token?role={role}",
        data={"username": email, "password": "password123"}
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}



# ───────────────────────────────────────────────────
# 1. Create Job
# ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_job(client: AsyncClient):
    headers = await get_auth_headers(client, "recruiter@test.com", "client")

    response = await client.post("/api/v1/jobs/", json={
        "title": "Test Job",
        "description": "A test description",
        "requirements": "Requirements",
        "location": "Remote",
        "salary_range": "100k"
    }, headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Job"
    assert data["owner_id"] is not None


# ───────────────────────────────────────────────────
# 2. Read Jobs
# ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_read_jobs(client: AsyncClient):
    headers = await get_auth_headers(client, "recruiter@test.com", "client")
    response = await client.get("/api/v1/jobs/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


# ───────────────────────────────────────────────────
# 3. Candidate Cannot Create Job
# ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_candidate_cannot_create_job(client: AsyncClient):
    headers = await get_auth_headers(client, "candidate@test.com", "candidate")

    response = await client.post("/api/v1/jobs/", json={
        "title": "Illegal Job",
        "description": "Should fail",
        "requirements": "Req",
        "location": "Remote",
        "salary_range": "100k"
    }, headers=headers)

    assert response.status_code == 403


# ───────────────────────────────────────────────────
# 4. Edit Job (Owner)
# ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_edit_job_as_owner(client: AsyncClient):
    """Client who created the job can update it."""
    headers = await get_auth_headers(client, "editjob_owner@test.com", "client")

    # Create job
    create = await client.post("/api/v1/jobs/", json={
        "title": "Original Title",
        "description": "Original Desc",
        "requirements": "Orig Req",
        "location": "NYC",
        "salary_range": "80k"
    }, headers=headers)
    assert create.status_code == 200
    job_id = create.json()["id"]

    # Update job
    update = await client.put(f"/api/v1/jobs/{job_id}", json={
        "title": "Updated Title",
        "description": "Updated Desc",
        "salary_range": "100k-120k",
    }, headers=headers)
    assert update.status_code == 200
    data = update.json()
    assert data["title"] == "Updated Title"
    assert data["description"] == "Updated Desc"
    assert data["salary_range"] == "100k-120k"
    # Original fields should be preserved
    assert data["location"] == "NYC"


@pytest.mark.asyncio
async def test_edit_job_toggle_active(client: AsyncClient):
    """Owner can deactivate a job posting."""
    headers = await get_auth_headers(client, "editjob_active@test.com", "client")

    create = await client.post("/api/v1/jobs/", json={
        "title": "Active Job",
        "description": "Desc",
    }, headers=headers)
    job_id = create.json()["id"]
    assert create.json()["is_active"] is True

    # Deactivate
    update = await client.put(f"/api/v1/jobs/{job_id}", json={
        "is_active": False,
    }, headers=headers)
    assert update.status_code == 200
    assert update.json()["is_active"] is False


@pytest.mark.asyncio
async def test_edit_job_non_owner_fails(client: AsyncClient):
    """A different client cannot edit another client's job."""
    owner_headers = await get_auth_headers(client, "editjob_ownerA@test.com", "client")
    other_headers = await get_auth_headers(client, "editjob_other@test.com", "client")

    create = await client.post("/api/v1/jobs/", json={
        "title": "Owner A Job",
        "description": "Desc",
    }, headers=owner_headers)
    job_id = create.json()["id"]

    # Other client tries to edit
    update = await client.put(f"/api/v1/jobs/{job_id}", json={
        "title": "Hijacked",
    }, headers=other_headers)
    assert update.status_code == 403


@pytest.mark.asyncio
async def test_edit_nonexistent_job_returns_404(client: AsyncClient):
    """Editing a job that doesn't exist returns 404."""
    headers = await get_auth_headers(client, "editjob_404@test.com", "client")
    update = await client.put("/api/v1/jobs/999999", json={
        "title": "Ghost Job",
    }, headers=headers)
    assert update.status_code == 404


@pytest.mark.asyncio
async def test_candidate_cannot_edit_job(client: AsyncClient):
    """Candidates should not be able to edit jobs."""
    client_headers = await get_auth_headers(client, "editjob_creator@test.com", "client")
    candidate_headers = await get_auth_headers(client, "editjob_cand@test.com", "candidate")

    create = await client.post("/api/v1/jobs/", json={
        "title": "Client Job",
        "description": "Desc",
    }, headers=client_headers)
    job_id = create.json()["id"]

    update = await client.put(f"/api/v1/jobs/{job_id}", json={
        "title": "Candidate Hack",
    }, headers=candidate_headers)
    assert update.status_code == 403
