from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class JobBase(BaseModel):
    title: str
    description: str
    requirements: Optional[str] = None
    nice_to_have_requirements: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    is_active: bool = True

class JobCreate(JobBase):
    pass

class JobUpdate(JobBase):
    title: Optional[str] = None
    description: Optional[str] = None

class JobInDBBase(JobBase):
    id: int
    owner_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class JobResponse(JobInDBBase):
    pass
