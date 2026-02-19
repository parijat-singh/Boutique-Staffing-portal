import pytest
from httpx import AsyncClient
from app.models.user import UserRole
from tests.conftest import get_auth_headers

# -----------------------------------------------------------------------------
# Test Data Setup Helpers
# -----------------------------------------------------------------------------

async def create_job(client: AsyncClient, headers: dict, title: str, is_active: bool = True):
    """Helper to create a job via API."""
    response = await client.post(
        "/api/v1/jobs/",
        headers=headers,
        json={
            "title": title,
            "description": "Test Description",
            "is_active": is_active,
            "location": "Remote",
            "salary_range": "100k-150k",
            "job_type": "Full-time",
            "experience_level": "Senior"
        }
    )
    assert response.status_code == 200
    return response.json()

async def apply_to_job(client: AsyncClient, headers: dict, job_id: int):
    """Helper to apply to a job."""
    # Create a dummy resume file
    files = {'resume': ('resume.pdf', b'dummy content', 'application/pdf')}
    data = {'job_id': str(job_id)}
    
    response = await client.post(
        "/api/v1/applications/",
        headers=headers,
        data=data,
        files=files
    )
    # 200 OK or 409 Conflict (already applied) are acceptable for test setup
    if response.status_code == 409:
        # If conflict, we can't easily get the ID without fetching "me", 
        # so for this helper assume success or harmless conflict.
        pass
    else:
        assert response.status_code == 200
    return response

# -----------------------------------------------------------------------------
# 1. Job Visibility & Filtering Tests
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_job_visibility_filtering(client: AsyncClient):
    """
    Verify:
    - Candidates see only active jobs.
    - Clients see only THEIR jobs.
    - Admins see ALL jobs.
    """
    # 1. Setup Users
    client1_headers = await get_auth_headers(client, "client1@example.com", "client")
    client2_headers = await get_auth_headers(client, "client2@example.com", "client")
    candidate_headers = await get_auth_headers(client, "candidate1@example.com", "candidate")
    admin_headers = await get_auth_headers(client, "admin1@example.com", "admin")

    # 2. Setup Jobs
    # Client 1 creates an Active job and an Inactive job
    job1_c1 = await create_job(client, client1_headers, "C1 Active Job", is_active=True)
    job2_c1 = await create_job(client, client1_headers, "C1 Inactive Job", is_active=False)
    
    # Client 2 creates an Active job
    job3_c2 = await create_job(client, client2_headers, "C2 Active Job", is_active=True)

    # 3. Test Candidate View (Only Active Jobs)
    res = await client.get("/api/v1/jobs/", headers=candidate_headers)
    assert res.status_code == 200
    jobs = res.json()
    job_ids = [j["id"] for j in jobs]
    
    assert job1_c1["id"] in job_ids  # Should see active
    assert job3_c2["id"] in job_ids  # Should see active from any client
    assert job2_c1["id"] not in job_ids # Should NOT see inactive

    # 4. Test Client 1 View (Only Client 1's Jobs)
    res = await client.get("/api/v1/jobs/", headers=client1_headers)
    assert res.status_code == 200
    jobs = res.json()
    job_ids = [j["id"] for j in jobs]
    
    assert job1_c1["id"] in job_ids
    assert job2_c1["id"] in job_ids
    assert job3_c2["id"] not in job_ids # Should NOT see Client 2's job

    # 5. Test Admin View (All Jobs)
    res = await client.get("/api/v1/jobs/", headers=admin_headers)
    assert res.status_code == 200
    jobs = res.json()
    job_ids = [j["id"] for j in jobs]
    
    assert job1_c1["id"] in job_ids
    assert job2_c1["id"] in job_ids
    assert job3_c2["id"] in job_ids

# -----------------------------------------------------------------------------
# 2. Job Details Access Tests (Eager Loading Check)
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_job_details_access(client: AsyncClient):
    """
    Verify access to single job details and ensure NO 500 error (MissingGreenlet).
    """
    client_headers = await get_auth_headers(client, "client_details@example.com", "client")
    candidate_headers = await get_auth_headers(client, "candidate_details@example.com", "candidate")
    
    job = await create_job(client, client_headers, "Details Test Job", is_active=True)
    job_id = job["id"]

    # 1. Client Access (Own Job)
    res = await client.get(f"/api/v1/jobs/{job_id}", headers=client_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "Details Test Job"
    assert "owner" in data # Critical check for eager loading
    assert data["owner"]["email"] == "client_details@example.com"

    # 2. Candidate Access
    res = await client.get(f"/api/v1/jobs/{job_id}", headers=candidate_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "Details Test Job"
    # Owner might be hidden or shown depending on schema, but request shouldn't crash
    if "owner" in data and data["owner"]: 
         assert data["owner"]["email"] == "client_details@example.com"

# -----------------------------------------------------------------------------
# 3. Application Access Tests (Fix Verification)
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_application_list_access(client: AsyncClient):
    """
    Verify:
    - Admin can see applicants (Fix 1).
    - Client can see applicants for their job.
    - Candidate CANNOT see applicants.
    - No 500 error on eager loading (Fix 2).
    """
    # Setup
    client_headers = await get_auth_headers(client, "client_apps@example.com", "client")
    admin_headers = await get_auth_headers(client, "admin_apps@example.com", "admin")
    candidate_headers = await get_auth_headers(client, "candidate_apps@example.com", "candidate")
    
    # Create Job and Apply
    job = await create_job(client, client_headers, "App Test Job", is_active=True)
    job_id = job["id"]
    await apply_to_job(client, candidate_headers, job_id)
    
    # 1. Admin Access
    res = await client.get(f"/api/v1/jobs/{job_id}/applications", headers=admin_headers)
    assert res.status_code == 200
    apps = res.json()
    assert len(apps) > 0
    # Check eager loading
    assert "user" in apps[0] 
    assert apps[0]["user"]["email"] == "candidate_apps@example.com"

    # 2. Client Access
    res = await client.get(f"/api/v1/jobs/{job_id}/applications", headers=client_headers)
    assert res.status_code == 200
    apps = res.json()
    assert len(apps) > 0
    assert apps[0]["user"]["email"] == "candidate_apps@example.com"

    # 3. Candidate Access (Should be forbidden)
    res = await client.get(f"/api/v1/jobs/{job_id}/applications", headers=candidate_headers)
    assert res.status_code == 403

# -----------------------------------------------------------------------------
# 4. Admin Manage Jobs Tests (CRUD)
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_admin_manage_jobs(client: AsyncClient):
    """
    Verify Admin can:
    - View all jobs (already covered in filtering test)
    - Update any job
    - Delete any job
    """
    # Setup
    client_headers = await get_auth_headers(client, "client_admin_test@example.com", "client")
    admin_headers = await get_auth_headers(client, "admin_manage@example.com", "admin")
    
    # Client creates a job
    job = await create_job(client, client_headers, "Job to Manage", is_active=True)
    job_id = job["id"]
    
    # 1. Admin Updates Job
    update_data = {"title": "Updated by Admin", "is_active": False}
    res = await client.put(f"/api/v1/jobs/{job_id}", headers=admin_headers, json=update_data)
    assert res.status_code == 200
    updated_job = res.json()
    assert updated_job["title"] == "Updated by Admin"
    assert updated_job["is_active"] == False
    
    # Verify persistence
    res = await client.get(f"/api/v1/jobs/{job_id}", headers=client_headers)
    assert res.json()["title"] == "Updated by Admin"
    
    # 2. Admin Deletes Job
    res = await client.delete(f"/api/v1/jobs/{job_id}", headers=admin_headers)
    assert res.status_code == 200
    
    # Verify deletion
    res = await client.get(f"/api/v1/jobs/{job_id}", headers=admin_headers)
    assert res.status_code == 404

# Helpers are now imported from conftest or available via fixtures
# We need to make sure we use the shared get_auth_headers which is more robust
