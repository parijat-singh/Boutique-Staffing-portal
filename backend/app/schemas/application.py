from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.schemas.job import JobResponse

class ApplicationBase(BaseModel):
    job_id: int

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationInDBBase(ApplicationBase):
    id: int
    user_id: int
    status: str
    resume_path: Optional[str] = None
    ai_score: Optional[int] = None
    ai_analysis: Optional[str] = None # JSON string or Dict? Model has Text.
    is_reviewed: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True

class ApplicationResponse(ApplicationInDBBase):
    job: Optional[JobResponse] = None
    ai_analysis_json: Optional[dict] = None # Helper field if we parse it
