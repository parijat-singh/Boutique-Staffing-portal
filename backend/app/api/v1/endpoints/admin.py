from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.models.user import User, UserRole
from app.schemas.user import User as UserSchema
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/users", response_model=List[UserSchema])
async def read_users(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve all users. Admin only.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )
    
    stmt = select(User).offset(skip).limit(limit)
    result = await db.execute(stmt)
    users = result.scalars().all()
    return users

@router.put("/users/{user_id}/status", response_model=UserSchema)
async def update_user_status(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_id: int,
    is_active: bool,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Activate/Deactivate a user. Admin only.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )
        
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
        
    user.is_active = is_active
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
