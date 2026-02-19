
import pytest
from httpx import AsyncClient

async def get_candidate_headers(client: AsyncClient, email: str = "candidate_view_test@example.com"):
    # Signup
    await client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "password123",
        "role": "candidate",
        "first_name": "Candidate",
        "last_name": "ViewTest",
        "phone_number": "5551114444",
        "years_of_experience": 5,
        "work_permit_type": "US Citizen",
        "linkedin_url": "https://linkedin.com/in/cantest"
    })
    
    # Login
    response = await client.post(
        f"/api/v1/auth/login/access-token?role=candidate",
        data={"username": email, "password": "password123"}
    )
    if response.status_code == 200:
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return None

async def create_job_as_client(client: AsyncClient, job_data: dict):
    email = "client_poster@example.com"
    # Signup if needed
    await client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "password123",
        "role": "client",
        "first_name": "Client",
        "last_name": "Poster",
        "phone_number": "5552225555",
        "company_name": "Posting Corp",
        "designation": "Recruiter"
    })
    
    # Login
    response = await client.post(
        "/api/v1/auth/login/access-token?role=client",
        data={"username": email, "password": "password123"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create Job
    resp = await client.post("/api/v1/jobs/", json=job_data, headers=headers)
    return resp.json()

@pytest.mark.asyncio
async def test_candidate_sees_active_jobs(client: AsyncClient):
    # 1. Create Active Job
    job = await create_job_as_client(client, {
        "title": "Visible Job",
        "description": "Should be seen",
        "location": "Remote",
        "salary_range": "100k",
        "job_type": "Full-time",
        "experience_level": "Senior" 
        # is_active defaults to True
    })
    
    # 2. Get Candidate Headers
    headers = await get_candidate_headers(client)
    
    # 3. Candidate Fetches Jobs
    resp = await client.get("/api/v1/jobs/", headers=headers)
    assert resp.status_code == 200
    jobs = resp.json()
    
    # 4. Verify Job is Visible
    found = any(j['id'] == job['id'] for j in jobs)
    assert found, "Candidate should see the active job"
