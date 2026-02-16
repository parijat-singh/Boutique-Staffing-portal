import pytest
from httpx import AsyncClient
from unittest.mock import patch
import json
import io

# Helper functions (copied from test_applications.py or imported if possible)
async def get_auth_headers(client: AsyncClient, email: str, role: str):
    """Register a user and return auth headers."""
    # Try login first in case user exists
    login_response = await client.post(
        f"/api/v1/auth/login/access-token",
        data={"username": email, "password": "password123"}
    )
    if login_response.status_code == 200:
        token = login_response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
        
    # Signup if not exists
    from tests.conftest import make_candidate_payload, make_client_payload
    payload = make_candidate_payload(email, role=role) if role == "candidate" else make_client_payload(email)
    await client.post("/api/v1/auth/signup", json=payload)
    
    login_response = await client.post(
        f"/api/v1/auth/login/access-token",
        data={"username": email, "password": "password123"}
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

async def create_job(client: AsyncClient, headers: dict, title: str = "Test Job") -> int:
    response = await client.post("/api/v1/jobs/", json={
        "title": title,
        "description": "Test description",
        "requirements": "Must have Python",
        "location": "Remote",
        "salary_range": "100k"
    }, headers=headers)
    return response.json()["id"]

# ───────────────────────────────────────────────────
# Tests
# ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_application_detail_with_ai_analysis(client: AsyncClient):
    """
    Verify GET /applications/{id} returns full details including parsed AI analysis.
    """
    recruiter_headers = await get_auth_headers(client, "detail_recruiter@test.com", "client")
    job_id = await create_job(client, recruiter_headers, "AI Analysis Job")
    
    candidate_headers = await get_auth_headers(client, "detail_candidate@test.com", "candidate")
    
    # Mock AI response
    mock_ai_result = {
        "match_count": 5,
        "score": 85,
        "justification": "Good match",
        "gap_analysis": []
    }
    
    with patch("app.services.ai_screening.ai_screening_service.evaluate_candidate") as mock_eval:
        mock_eval.return_value = mock_ai_result
        
        # Apply
        fake_resume = io.BytesIO(b"%PDF-1.4 fake resume content")
        fake_resume.name = "resume_detail.pdf"
        
        apply_response = await client.post(
            "/api/v1/applications/",
            data={"job_id": str(job_id)},
            files={"resume": ("resume_detail.pdf", fake_resume, "application/pdf")},
            headers=candidate_headers,
        )
        assert apply_response.status_code == 200
        app_id = apply_response.json()["id"]

    # Get Detail
    # Candidate should be able to see their own application
    response = await client.get(f"/api/v1/applications/{app_id}", headers=candidate_headers)
    assert response.status_code == 200
    data = response.json()
    
    # Verify Fields
    assert data["id"] == app_id
    assert "job" in data
    assert data["job"]["id"] == job_id
    assert "user" in data
    assert data["user"]["email"] == "detail_candidate@test.com"
    assert "ai_analysis_json" in data
    assert data["ai_analysis_json"] == mock_ai_result
    assert data["resume_path"] is not None


@pytest.mark.asyncio
async def test_list_applications_includes_enrichment(client: AsyncClient):
    """
    Verify GET /jobs/{id}/applications includes user info and ai_analysis_json.
    """
    recruiter_headers = await get_auth_headers(client, "list_recruiter@test.com", "client")
    job_id = await create_job(client, recruiter_headers, "List Enrichment Job")
    
    candidate_headers = await get_auth_headers(client, "list_candidate@test.com", "candidate")
    
    # Mock AI
    mock_ai_result = {"score": 90, "summary": "Excellent"}
    
    with patch("app.services.ai_screening.ai_screening_service.evaluate_candidate") as mock_eval:
        mock_eval.return_value = mock_ai_result
        
        fake_resume = io.BytesIO(b"fake pdf")
        fake_resume.name = "resume_list.pdf"
        
        await client.post(
            "/api/v1/applications/",
            data={"job_id": str(job_id)},
            files={"resume": ("resume_list.pdf", fake_resume, "application/pdf")},
            headers=candidate_headers,
        )

    # Recruiter fetch list
    response = await client.get(f"/api/v1/jobs/{job_id}/applications", headers=recruiter_headers)
    assert response.status_code == 200
    apps = response.json()
    assert len(apps) >= 1
    
    app_data = apps[0]
    assert "user" in app_data
    assert app_data["user"]["first_name"] == "Test" # From make_candidate_payload default
    assert "ai_analysis_json" in app_data
    assert app_data["ai_analysis_json"] == mock_ai_result


@pytest.mark.asyncio
async def test_static_file_serving(client: AsyncClient):
    """
    Verify that uploaded resumes can be accessed via the /uploads mount.
    """
    # 1. Upload a file via application
    recruiter_headers = await get_auth_headers(client, "static_recruiter@test.com", "client")
    job_id = await create_job(client, recruiter_headers, "Static File Job")
    candidate_headers = await get_auth_headers(client, "static_candidate@test.com", "candidate")
    
    fake_content = b"Fake PDF Data for Static Test"
    fake_resume = io.BytesIO(fake_content)
    fake_resume.name = "static_test.pdf"
    
    # Mock AI to avoid side effects
    with patch("app.services.ai_screening.ai_screening_service.evaluate_candidate") as mock_eval:
        mock_eval.return_value = {"score": 0}
        
        apply_res = await client.post(
            "/api/v1/applications/",
            data={"job_id": str(job_id)},
            files={"resume": ("static_test.pdf", fake_resume, "application/pdf")},
            headers=candidate_headers,
        )
        assert apply_res.status_code == 200
        resume_path = apply_res.json()["resume_path"]
        
    # 2. Access the file via static mount
    # resume_path might be "uploads/user_job_filename"
    # The mount is at "/uploads", mapping to "uploads" directory.
    # If path is "uploads/xyz", requesting "/uploads/xyz" might look for "uploads/uploads/xyz" depending on strip settings?
    # backend/app/main.py: app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
    # Request to /uploads/filename maps to uploads/filename.
    
    # resume_path stored in DB is relative path? 
    # applications.py: file_location = f"uploads/{current_user.id}_{job_id}_{resume.filename}"
    # So stored path is "uploads/..."
    
    # If we request http://test/uploads/..., fastapi mount matches /uploads.
    # But if the file path is "uploads/filename", and directory="uploads", 
    # requesting /uploads/filename means looking for "uploads/filename" inside "uploads/" dir?
    # No, typically mount("/static", dir="static") means /static/foo.png -> static/foo.png.
    # Here mount("/uploads", dir="uploads"). 
    # Valid lookup: /uploads/filename.
    # But resume_path is "uploads/filename".
    # So we need to request "/" + resume_path? -> "/uploads/filename"
    
    url = f"/{resume_path}" 
    # url will be /uploads/user_job_filename.
    
    # But wait, if directory="uploads", then /uploads/x maps to uploads/x.
    # If resume_path="uploads/x", and we request /uploads/x...
    # It matches mount /uploads. Path remaining is /x.
    # Looks in directory "uploads" for "x".
    # But resume_path is "uploads/x"... so the file is at uploads/uploads/x ??
    # NO. 
    # application.py: file_location = f"uploads/{...}"
    # with open(file_location, "wb+") ...
    # So file is physically at ./uploads/user_job_filename
    
    # mount("/uploads", directory="uploads")
    # Request GET /uploads/user_job_filename
    # Route: /uploads
    # Path: /user_job_filename
    # File system: ./uploads/user_job_filename
    # This matches.
    
    response = await client.get(url)
    assert response.status_code == 200, f"Failed to fetch {url}"
    assert response.content == fake_content
