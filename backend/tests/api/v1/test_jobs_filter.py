
import pytest
from httpx import AsyncClient
from app.core.config import settings

# Helper to get auth headers (simplified adaptation from conftest)
async def get_admin_headers(client: AsyncClient):
    # Create a fresh admin for testing
    admin_email = "admin_test_filter@example.com"
    password = "password123"
    
    # Check if admin exists or create one
    # But since tests run with fresh DB usually (if conftest drops tables), we should create one.
    # However, if using shared DB (conftest warning), we might duplicate.
    
    # Try signup
    signup_resp = await client.post("/api/v1/auth/signup", json={
        "email": admin_email,
        "password": password,
        "role": "admin",
        "first_name": "Admin",
        "last_name": "Test",
        "phone_number": "5551113333"
    })
    
    # Login
    response = await client.post(
        f"/api/v1/auth/login/access-token?role=admin",
        data={"username": admin_email, "password": password}
    )
    if response.status_code == 200:
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return None

async def create_client_and_jobs(client: AsyncClient, email: str, jobs_data: list):
    # Register client
    client_payload = {
        "email": email,
        "password": "password123",
        "role": "client",
        "first_name": "Client",
        "last_name": "Test",
        "phone_number": "5550000000",
        "company_name": f"Company {email}",
        "designation": "Manager"
    }
    await client.post("/api/v1/auth/signup", json=client_payload)
    
    # Login
    response = await client.post(
        "/api/v1/auth/login/access-token?role=client",
        data={"username": email, "password": "password123"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create jobs
    created_jobs = []
    for job_data in jobs_data:
        resp = await client.post("/api/v1/jobs/", json=job_data, headers=headers)
        assert resp.status_code == 200
        created_jobs.append(resp.json())
        
        # If job calls for active=False, we might need to update it, as default create is True?
        # Schema request JobCreate doesn't have is_active, it defaults to True.
        # So we might need to update it if we want it inactive.
        if not job_data.get("is_active", True):
             job_id = resp.json()["id"]
             # Update to inactive. Only admin or owner can update.
             # JobUpdate schema allows is_active? 
             # Let's check JobUpdate in schema... 
             # JobUpdate uses JobBase which HAS is_active: Optional[bool] = True
             # So we can pass is_active in update.
             update_resp = await client.put(f"/api/v1/jobs/{job_id}", json={"is_active": False}, headers=headers)
             assert update_resp.status_code == 200

    return headers, created_jobs

@pytest.mark.asyncio
async def test_filter_jobs_by_status_and_owner(client: AsyncClient):
    # 1. Setup Admin
    admin_headers = await get_admin_headers(client)
    if not admin_headers:
        # If admin doesn't exist, we might need to rely on init_db or create one.
        # For this test, let's assume we can create one or use FIRST_SUPERUSER
        pass

    # 2. Setup Clients and Jobs
    client1_email = "client1_filter@example.com"
    client2_email = "client2_filter@example.com"
    
    # Job data
    # Client 1: 1 Active, 1 Inactive
    client1_jobs = [
        {"title": "C1 Active", "description": "desc", "is_active": True},
        {"title": "C1 Inactive", "description": "desc", "is_active": False},
    ]
    
    # Client 2: 1 Active
    client2_jobs = [
        {"title": "C2 Active", "description": "desc", "is_active": True},
    ]

    c1_headers, c1_created = await create_client_and_jobs(client, client1_email, client1_jobs)
    c2_headers, c2_created = await create_client_and_jobs(client, client2_email, client2_jobs)
    
    c1_id = c1_created[0]['owner_id']
    c2_id = c2_created[0]['owner_id']

    # 3. Test Filters as Admin
    # Get Admin Headers (Assuming we have them, if not, create temp admin)
    # Re-login as admin
    # The system should have an admin from seed or init. 
    # Let's try to create a temp admin if the helper failed/returned None?
    # But usually settings.FIRST_SUPERUSER works if seed_data runs.
    # We will try to rely on what logic exists.
    
    # Actually, let's create a fresh admin for this test to be sure
    admin_email_test = "admin_filter@example.com"
    await client.post("/api/v1/auth/signup", json={
        "email": admin_email_test,
        "password": "password123",
        "role": "admin",
        "first_name": "Admin",
        "last_name": "Test",
        "phone_number": "5551112222"
    })
    
    response = await client.post(
        f"/api/v1/auth/login/access-token?role=admin",
        data={"username": admin_email_test, "password": "password123"}
    )
    admin_token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Case A: Filter by Active
    resp = await client.get("/api/v1/jobs/?is_active=true", headers=headers)
    assert resp.status_code == 200
    jobs = resp.json()
    # Should see C1 Active and C2 Active (and maybe others from other tests, so we check for existence of ours)
    c1_active_found = any(j['title'] == "C1 Active" for j in jobs)
    c1_inactive_found = any(j['title'] == "C1 Inactive" for j in jobs)
    c2_active_found = any(j['title'] == "C2 Active" for j in jobs)
    
    assert c1_active_found
    assert not c1_inactive_found
    assert c2_active_found
    
    # Case B: Filter by Inactive
    resp = await client.get("/api/v1/jobs/?is_active=false", headers=headers)
    jobs = resp.json()
    c1_active_found = any(j['title'] == "C1 Active" for j in jobs)
    c1_inactive_found = any(j['title'] == "C1 Inactive" for j in jobs)
    
    assert not c1_active_found
    assert c1_inactive_found
    
    # Case C: Filter by Owner (Client 1)
    resp = await client.get(f"/api/v1/jobs/?owner_id={c1_id}", headers=headers)
    jobs = resp.json()
    # Should see both C1 jobs (active and inactive? Default without is_active filter?)
    # Before, endpoint showed all if not Candidate?
    # Admin can see all.
    # Let's check logic: if is_active is None, no filter on is_active for Admin.
    
    c1_active_found = any(j['title'] == "C1 Active" for j in jobs)
    c1_inactive_found = any(j['title'] == "C1 Inactive" for j in jobs)
    c2_active_found = any(j['title'] == "C2 Active" for j in jobs)
    
    assert c1_active_found
    assert c1_inactive_found
    assert not c2_active_found
    
    # Case D: Filter by Owner (Client 1) AND Inactive
    resp = await client.get(f"/api/v1/jobs/?owner_id={c1_id}&is_active=false", headers=headers)
    jobs = resp.json()
    
    c1_active_found = any(j['title'] == "C1 Active" for j in jobs)
    c1_inactive_found = any(j['title'] == "C1 Inactive" for j in jobs)
    
    assert not c1_active_found
    assert c1_inactive_found

    # Check Owner Field in Response
    assert 'owner' in jobs[0]
    assert jobs[0]['owner']['email'] == client1_email

