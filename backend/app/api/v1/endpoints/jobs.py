from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.models.job import Job
from app.models.user import User, UserRole
from app.schemas.job import JobCreate, JobResponse, JobUpdate
from app.schemas.application import ApplicationResponse
from app.api.deps import get_current_user
from sqlalchemy.orm import selectinload

router = APIRouter()

@router.post("/", response_model=JobResponse)
async def create_job(
    *,
    db: AsyncSession = Depends(deps.get_db),
    job_in: JobCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new job. Only Clients (Recruiters) can create jobs.
    """
    if current_user.role != UserRole.CLIENT and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create jobs",
        )
        
    job = Job(**job_in.dict(), owner_id=current_user.id)
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    # Fetch with owner to ensure response model can validate it
    stmt = select(Job).options(selectinload(Job.owner)).where(Job.id == job.id)
    result = await db.execute(stmt)
    job = result.scalars().first()
    
    return job

@router.get("/", response_model=List[JobResponse])
async def read_jobs(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    owner_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve jobs with advanced filtering.
    """
    stmt = select(Job)
    
    # Base authorization filters
    # Use Enum comparison directly
    
    if current_user.role == UserRole.CLIENT:
        stmt = stmt.where(Job.owner_id == current_user.id)
    
    if current_user.role == UserRole.CANDIDATE:
        stmt = stmt.where(Job.is_active == True)

    # Advanced filters
    if is_active is not None:
        # If Admin, they can filter by is_active.
        # If Client, they can filter by is_active (their own jobs).
        # If Candidate, they only see active.
        if current_user.role != UserRole.CANDIDATE:
             stmt = stmt.where(Job.is_active == is_active)

    if owner_id:
        stmt = stmt.where(Job.owner_id == owner_id)

    if location:
        stmt = stmt.where(Job.location.ilike(f"%{location}%"))
    if job_type:
        stmt = stmt.where(Job.job_type == job_type)
    if experience_level:
        stmt = stmt.where(Job.experience_level == experience_level)
    if search:
        # Simple keyword search in title, description, and requirements
        stmt = stmt.where(
            (Job.title.ilike(f"%{search}%")) | 
            (Job.description.ilike(f"%{search}%")) |
            (Job.requirements.ilike(f"%{search}%"))
        )

    stmt = stmt.offset(skip).limit(limit).order_by(Job.created_at.desc()).options(selectinload(Job.owner))
    
    result = await db.execute(stmt)
    jobs = result.scalars().all()
    return jobs

@router.get("/{id}", response_model=JobResponse)
async def read_job(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get job by ID.
    """
    stmt = select(Job).options(selectinload(Job.owner)).where(Job.id == id)
    result = await db.execute(stmt)
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.put("/{id}", response_model=JobResponse)
async def update_job(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    job_in: JobUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a job.
    """
    # Eager load owner for permission check and response
    stmt = select(Job).options(selectinload(Job.owner)).where(Job.id == id)
    result = await db.execute(stmt)
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to update this job")
        
    update_data = job_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)
        
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    # Fetch with owner to ensure response model can validate it
    stmt = select(Job).options(selectinload(Job.owner)).where(Job.id == id)
    result = await db.execute(stmt)
    job = result.scalars().first()
    
    return job

@router.delete("/{id}", response_model=JobResponse)
async def delete_job(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a job.
    """
    # Eager load owner for retrieval and permission check
    stmt = select(Job).options(selectinload(Job.owner)).where(Job.id == id)
    result = await db.execute(stmt)
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")
        
    # Serialize before deletion to preserve relation data (owner) 
    # and avoid MissingGreenlet error after commit/expiration.
    job_response = JobResponse.model_validate(job)
        
    await db.delete(job)
    await db.commit()
    return job_response

from app.schemas.application import ApplicationResponse
from sqlalchemy.orm import selectinload

@router.get("/{id}/applications", response_model=List[ApplicationResponse])
async def read_job_applications(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get all applications for a specific job. Only for the job owner.
    """
    stmt = select(Job).where(Job.id == id)
    result = await db.execute(stmt)
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to view applications for this job")
        
    # We need to load applications and potentially the candidate user info?
    # ApplicationResponse currently has 'job' but maybe we need 'user' (candidate) info too to show who applied.
    # Let's verify ApplicationResponse schema.
    
    # For now, let's return the applications. 
    # The actual loading of 'user' relationship might be needed if Pydantic schema expects it.
    
    # Let's assume we want to return the application with candidate info.
    # The current ApplicationResponse inherits from ApplicationInDBBase which has user_id.
    # If we want detailed User info, we might need to update the schema or rely on user_id.
    
    from app.models.application import Application
    stmt = select(Application).where(Application.job_id == id).options(
        selectinload(Application.user),
        selectinload(Application.job).selectinload(Job.owner)
    )
    result = await db.execute(stmt)
    applications = result.scalars().all()
    
    import json
    for app in applications:
        app.ai_analysis_json = None
        if app.ai_analysis:
            try:
                app.ai_analysis_json = json.loads(app.ai_analysis)
            except:
                app.ai_analysis_json = None
                
    return applications
