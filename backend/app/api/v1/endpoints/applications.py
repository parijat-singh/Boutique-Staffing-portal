from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import func

from app.api import deps
from app.models.application import Application, ApplicationStatus
from app.models.job import Job
from app.models.user import User, UserRole
from app.schemas.application import ApplicationCreate, ApplicationResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=ApplicationResponse)
async def create_application(
    *,
    db: AsyncSession = Depends(deps.get_db),
    job_id: int = Form(...),
    resume: UploadFile = File(...),
    force_update: bool = Form(False),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Apply to a job. Only Candidates can apply.
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can apply to jobs",
        )

    # Check if job exists
    stmt = select(Job).where(Job.id == job_id)
    result = await db.execute(stmt)
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if not job.is_active:
        raise HTTPException(status_code=400, detail="Job is not active")

    # Check if already applied
    stmt = select(Application).where(
        Application.user_id == current_user.id,
        Application.job_id == job_id
    )
    result = await db.execute(stmt)
    existing_application = result.scalars().first()
    if existing_application and not force_update:
        raise HTTPException(status_code=409, detail="You have already applied for this job. Do you want to overwrite your previous application?")

    # Save resume file
    file_location = f"uploads/{current_user.id}_{job_id}_{resume.filename}"
    file_content = await resume.read()
    with open(file_location, "wb+") as file_object:
        file_object.write(file_content)
    
    # Extract text and run AI screening
    from app.services.ai_screening import ai_screening_service
    import json
    
    resume_text = ai_screening_service.extract_text(file_content, resume.filename)
    
    if not resume_text:
         # Fallback or error if text extraction failed? 
         # For now proceeding with empty text which will likely give poor AI results, but better than crashing.
         print(f"Warning: Could not extract text from {resume.filename}")

    ai_result = await ai_screening_service.evaluate_candidate(
        resume_text=resume_text,
        job_title=job.title,
        must_have_requirements=job.requirements or "",
        nice_to_have_requirements=job.nice_to_have_requirements
    )
    
    if existing_application:
        # Update existing
        existing_application.resume_path = file_location
        existing_application.ai_score = ai_result.get("score", 0)
        existing_application.ai_analysis = json.dumps(ai_result)
        existing_application.created_at = func.now() # Update timestamp
        application = existing_application
    else:
        # Create new
        application = Application(
            user_id=current_user.id,
            job_id=job_id,
            status=ApplicationStatus.APPLIED,
            resume_path=file_location,
            ai_score=ai_result.get("score", 0),
            ai_analysis=json.dumps(ai_result)
        )
        db.add(application)
        
    await db.commit()
    await db.refresh(application)
    await db.refresh(job) # Refresh job to ensure back_populates works if needed
    await db.refresh(current_user) # Refresh user to ensure attributes are loaded
    application.job = job
    application.user = current_user
    application.ai_analysis_json = ai_result
    
    return application

@router.patch("/{application_id}/reviewed")
async def toggle_reviewed(
    application_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Toggle is_reviewed flag on an application. Only clients/admins.
    """
    if current_user.role == UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Candidates cannot mark applications as reviewed")
    
    stmt = select(Application).where(Application.id == application_id)
    result = await db.execute(stmt)
    application = result.scalars().first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    application.is_reviewed = not application.is_reviewed
    await db.commit()
    await db.refresh(application)
    return {"id": application.id, "is_reviewed": application.is_reviewed}

@router.get("/me", response_model=List[ApplicationResponse])
async def read_my_applications(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve my applications.
    """
    if current_user.role != UserRole.CANDIDATE:
        # Maybe admins or clients want to see their applications too if they could apply?
        # But for now, strict role check or just return empty?
        # Let's restrict to candidates for "my applications" in this context, 
        # or just return whatever they have (if any).
        pass

    stmt = select(Application).options(selectinload(Application.job)).where(
        Application.user_id == current_user.id
    ).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    applications = result.scalars().all()
    
    # Parse JSON for response
    import json
    for app in applications:
        if app.ai_analysis:
            try:
                app.ai_analysis_json = json.loads(app.ai_analysis)
            except:
                app.ai_analysis_json = None
                
    return applications

@router.get("/{id}", response_model=ApplicationResponse)
async def read_application(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get application by ID.
    Clients/Admins can view any application (or restrict to their jobs).
    Candidates can view their own.
    """
    stmt = select(Application).where(Application.id == id).options(
        selectinload(Application.job),
        selectinload(Application.user)
    )
    result = await db.execute(stmt)
    application = result.scalars().first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Authorization
    if current_user.role == UserRole.CANDIDATE:
        if application.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this application")
    elif current_user.role == UserRole.CLIENT:
        # Check if client owns the job
        if application.job.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this application")
            
    # Parse JSON
    import json
    if application.ai_analysis:
        try:
            application.ai_analysis_json = json.loads(application.ai_analysis)
        except:
             application.ai_analysis_json = None
             
    return application
