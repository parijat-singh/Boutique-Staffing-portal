from typing import Any, Optional
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.core import security
from app.models.user import User
from app.schemas.user import User as UserSchema, UserUpdate
from app.db.session import get_db

router = APIRouter()

@router.get("/me", response_model=UserSchema)
async def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=UserSchema)
async def update_user_me(
    *,
    db: AsyncSession = Depends(deps.get_db),
    password: Optional[str] = Body(None),
    email: Optional[str] = Body(None),
    first_name: Optional[str] = Body(None),
    middle_initial: Optional[str] = Body(None),
    last_name: Optional[str] = Body(None),
    phone_number: Optional[str] = Body(None),
    city: Optional[str] = Body(None),
    state: Optional[str] = Body(None),
    years_of_experience: Optional[int] = Body(None),
    work_permit_type: Optional[str] = Body(None),
    linkedin_url: Optional[str] = Body(None),
    company_name: Optional[str] = Body(None),
    designation: Optional[str] = Body(None),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update own user profile.
    """
    # Check if email is being updated and if it's already taken
    if email and email != current_user.email:
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        existing = result.scalars().first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="The user with this email already exists in the system",
            )
        current_user.email = email

    if password:
        current_user.hashed_password = security.get_password_hash(password)
    
    # Update profile fields (only if provided)
    if first_name is not None:
        current_user.first_name = first_name
    if middle_initial is not None:
        current_user.middle_initial = middle_initial
    if last_name is not None:
        current_user.last_name = last_name
    if phone_number is not None:
        current_user.phone_number = phone_number
    if city is not None:
        current_user.city = city
    if state is not None:
        current_user.state = state
    if years_of_experience is not None:
        current_user.years_of_experience = years_of_experience
    if work_permit_type is not None:
        current_user.work_permit_type = work_permit_type
    if linkedin_url is not None:
        current_user.linkedin_url = linkedin_url
    if company_name is not None:
        current_user.company_name = company_name
    if designation is not None:
        current_user.designation = designation
        
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user
