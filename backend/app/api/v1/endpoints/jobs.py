from typing import Any, List
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
    return job

@router.get("/", response_model=List[JobResponse])
async def read_jobs(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve jobs.
    """
    # If client, return only their jobs? Or all jobs?
    # For now, let's return all jobs for everyone, but we might want to filter later.
    # Actually, the plan said "Filter by client for Clients" which implies clients see their own.
    # But usually clients also want to see the general pool? 
    # Let's stick to: Clients see their own, Candidates see all open.
    
    stmt = select(Job).offset(skip).limit(limit)
    
    if current_user.role == UserRole.CLIENT:
        stmt = stmt.where(Job.owner_id == current_user.id)
    
    if current_user.role == UserRole.CANDIDATE:
        stmt = stmt.where(Job.is_active == True)

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
    stmt = select(Job).where(Job.id == id)
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
    stmt = select(Job).where(Job.id == id)
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
    stmt = select(Job).where(Job.id == id)
    result = await db.execute(stmt)
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")
        
    await db.delete(job)
    await db.commit()
    return job

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
        
    if job.owner_id != current_user.id:
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
        selectinload(Application.job)
    )
    result = await db.execute(stmt)
    applications = result.scalars().all()
    
    import json
    for app in applications:
        if app.ai_analysis:
            try:
                app.ai_analysis_json = json.loads(app.ai_analysis)
            except:
                app.ai_analysis_json = None
                
    return applications
