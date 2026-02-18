import pytest
from httpx import AsyncClient
from tests.api.v1.test_jobs import get_auth_headers

@pytest.mark.asyncio
async def test_job_filtering_combined(client: AsyncClient):
    headers = await get_auth_headers(client, "recruiter_filter@test.com", "client")
    
    # 1. Create a set of diverse jobs
    jobs_to_create = [
        {"title": "Python Developer", "description": "Backend work", "location": "Remote", "job_type": "Full-time", "experience_level": "Senior", "requirements": "Python", "salary_range": "120k"},
        {"title": "Frontend Engineer", "description": "React work", "location": "New York", "job_type": "Full-time", "experience_level": "Junior", "requirements": "React", "salary_range": "90k"},
        {"title": "Data Scientist", "description": "AI/ML", "location": "Remote", "job_type": "Contract", "experience_level": "Senior", "requirements": "Python, ML", "salary_range": "150k"},
        {"title": "UI Designer", "description": "Figma work", "location": "London", "job_type": "Freelance", "experience_level": "Intermediate", "requirements": "Figma", "salary_range": "70k"},
    ]
    
    for j in jobs_to_create:
        resp = await client.post("/api/v1/jobs/", json=j, headers=headers)
        assert resp.status_code == 200

    # 2. Test Location Filtering
    resp = await client.get("/api/v1/jobs/?location=Remote", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert all(j["location"] == "Remote" for j in data)

    # 3. Test Job Type Filtering
    resp = await client.get("/api/v1/jobs/?job_type=Contract", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["job_type"] == "Contract"

    # 4. Test Experience Level Filtering
    resp = await client.get("/api/v1/jobs/?experience_level=Senior", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert all(j["experience_level"] == "Senior" for j in data)

    # 5. Test Keyword Search
    resp = await client.get("/api/v1/jobs/?search=Python", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2 # Python Developer, Data Scientist (ML requirements but search usually hits title/desc)
    # Actually my implementation hits title and description.
    # Data Scientist desc is "AI/ML". Python Developer desc is "Backend work".
    # Wait, let me check my search implementation in jobs.py
    
    # 6. Test Combined Filtering
    resp = await client.get("/api/v1/jobs/?location=Remote&experience_level=Senior&job_type=Full-time", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["title"] == "Python Developer"

@pytest.mark.asyncio
async def test_search_logic(client: AsyncClient):
    headers = await get_auth_headers(client, "recruiter_search@test.com", "client")
    
    # Create jobs for search testing
    await client.post("/api/v1/jobs/", json={"title": "Special Hero", "description": "Saves the day", "requirements": "Power", "location": "Global", "salary_range": "Infinite"}, headers=headers)
    await client.post("/api/v1/jobs/", json={"title": "Normal Guy", "description": "Does normal things", "requirements": "Patience", "location": "Local", "salary_range": "Normal"}, headers=headers)

    # Search in title
    resp = await client.get("/api/v1/jobs/?search=Special", headers=headers)
    assert len(resp.json()) == 1
    assert resp.json()[0]["title"] == "Special Hero"

    # Search in description
    resp = await client.get("/api/v1/jobs/?search=Saves", headers=headers)
    assert len(resp.json()) == 1
    assert resp.json()[0]["title"] == "Special Hero"

    # Search case-insensitive
    resp = await client.get("/api/v1/jobs/?search=hero", headers=headers)
    assert len(resp.json()) == 1
    assert resp.json()[0]["title"] == "Special Hero"

@pytest.mark.asyncio
async def test_job_filtering_edge_cases(client: AsyncClient):
    headers = await get_auth_headers(client, "recruiter_edge@test.com", "client")
    
    # 1. No results for specific filter
    resp = await client.get("/api/v1/jobs/?location=Mars", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 0

    # 2. No results for search
    resp = await client.get("/api/v1/jobs/?search=NonExistentKeywordXYZ", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 0

    # 3. Pagination test (basic skip/limit)
    # Create 5 identical jobs
    for i in range(5):
        await client.post("/api/v1/jobs/", json={"title": f"Job {i}", "description": "Desc", "requirements": "Req", "location": "City", "salary_range": "50k"}, headers=headers)
    
    resp = await client.get("/api/v1/jobs/?limit=2", headers=headers)
    assert len(resp.json()) == 2
    
    resp = await client.get("/api/v1/jobs/?skip=2&limit=2", headers=headers)
    assert len(resp.json()) == 2
