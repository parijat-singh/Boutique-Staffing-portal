import pytest
from httpx import AsyncClient
from tests.conftest import make_candidate_payload, get_auth_headers


async def create_job(client: AsyncClient, headers: dict, title: str = "Test Job") -> int:
    """Helper to create a job and return its ID."""
    response = await client.post("/api/v1/jobs/", json={
        "title": title,
        "description": "A test job description",
        "requirements": "Test requirements",
        "location": "Remote",
        "salary_range": "100k"
    }, headers=headers)
    return response.json()["id"]


# ───────────────────────────────────────────────────
# 1. Apply for a Job
# ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_apply_for_job(client: AsyncClient):
    """Candidate can apply to a job with a resume."""
    recruiter_headers = await get_auth_headers(client, "recruiter_app@test.com", "client")
    job_id = await create_job(client, recruiter_headers, "Job to Apply")

    candidate_headers = await get_auth_headers(client, "candidate_app@test.com", "candidate")

    # Create a fake PDF file
    import io
    fake_resume = io.BytesIO(b"%PDF-1.4 fake resume content")
    fake_resume.name = "resume.pdf"

    apply_response = await client.post(
        "/api/v1/applications/",
        data={"job_id": str(job_id)},
        files={"resume": ("resume.pdf", fake_resume, "application/pdf")},
        headers=candidate_headers,
    )
    assert apply_response.status_code == 200
    data = apply_response.json()
    assert data["job_id"] == job_id


# ───────────────────────────────────────────────────
# 2. View My Applications
# ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_view_my_applications(client: AsyncClient):
    """Candidate can view their own applications."""
    candidate_headers = await get_auth_headers(client, "candidate_view@test.com", "candidate")
    response = await client.get("/api/v1/applications/me", headers=candidate_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


# ───────────────────────────────────────────────────
# 3. Applied Jobs Appear in Application List
# ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_applied_job_appears_in_my_applications(client: AsyncClient):
    """After applying, the application should appear in /applications/me."""
    recruiter_headers = await get_auth_headers(client, "recruiter_applied@test.com", "client")
    job_id = await create_job(client, recruiter_headers, "Applied Job Test")

    candidate_headers = await get_auth_headers(client, "candidate_applied@test.com", "candidate")

    import io
    fake_resume = io.BytesIO(b"%PDF-1.4 fake resume")
    await client.post(
        "/api/v1/applications/",
        data={"job_id": str(job_id)},
        files={"resume": ("resume.pdf", fake_resume, "application/pdf")},
        headers=candidate_headers,
    )

    # Check that the job appears in my applications
    response = await client.get("/api/v1/applications/me", headers=candidate_headers)
    assert response.status_code == 200
    apps = response.json()
    applied_job_ids = [a["job_id"] for a in apps]
    assert job_id in applied_job_ids


# ───────────────────────────────────────────────────
# 4. Duplicate Application Prevention
# ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_duplicate_application_returns_409(client: AsyncClient):
    """Applying to the same job twice without force_update returns 409."""
    recruiter_headers = await get_auth_headers(client, "recruiter_dup@test.com", "client")
    job_id = await create_job(client, recruiter_headers, "Dup App Job")

    candidate_headers = await get_auth_headers(client, "candidate_dup@test.com", "candidate")

    import io
    fake_resume = io.BytesIO(b"%PDF-1.4 fake resume 1")
    await client.post(
        "/api/v1/applications/",
        data={"job_id": str(job_id)},
        files={"resume": ("resume.pdf", fake_resume, "application/pdf")},
        headers=candidate_headers,
    )

    # Try again without force_update
    fake_resume2 = io.BytesIO(b"%PDF-1.4 fake resume 2")
    dup = await client.post(
        "/api/v1/applications/",
        data={"job_id": str(job_id)},
        files={"resume": ("resume2.pdf", fake_resume2, "application/pdf")},
        headers=candidate_headers,
    )
    assert dup.status_code == 409


# ───────────────────────────────────────────────────
# 5. Client Cannot Apply
# ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_client_cannot_apply(client: AsyncClient):
    """Clients should not be able to apply for jobs."""
    recruiter_headers = await get_auth_headers(client, "recruiter_noapply@test.com", "client")
    job_id = await create_job(client, recruiter_headers, "No Apply Job")

    import io
    fake_resume = io.BytesIO(b"%PDF-1.4 fake resume")
    response = await client.post(
        "/api/v1/applications/",
        data={"job_id": str(job_id)},
        files={"resume": ("resume.pdf", fake_resume, "application/pdf")},
        headers=recruiter_headers,
    )
    assert response.status_code == 403


# ───────────────────────────────────────────────────
# 6. Unauthenticated Cannot View Applications
# ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_unauthenticated_cannot_view_applications(client: AsyncClient):
    """Unauthenticated users cannot access /applications/me."""
    response = await client.get("/api/v1/applications/me")
    assert response.status_code in [401, 403]
