from datetime import timedelta
from typing import Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User, UserRole
from app.schemas.user import Token, UserCreate
from app.db.session import get_db

router = APIRouter()

@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
    role: Optional[str] = Query(None, description="User role: admin, client, or candidate"),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    Now accepts an optional 'role' query parameter to distinguish users with the same email.
    """
    stmt = select(User).where(User.email == form_data.username)
    
    if role:
        try:
            user_role = UserRole(role.lower())
            stmt = stmt.where(User.role == user_role)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {role}")
    
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/signup", response_model=Token)
async def signup(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create new user without the need to be logged in.
    Now checks (email, role) uniqueness instead of email alone.
    """
    stmt = select(User).where(User.email == user_in.email, User.role == user_in.role)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400,
            detail=f"A {user_in.role.value} account with this email already exists",
        )
    
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        role=user_in.role,
        is_active=True,
        first_name=user_in.first_name,
        middle_initial=user_in.middle_initial,
        last_name=user_in.last_name,
        phone_number=user_in.phone_number,
        city=user_in.city,
        state=user_in.state,
        years_of_experience=user_in.years_of_experience,
        work_permit_type=user_in.work_permit_type,
        linkedin_url=user_in.linkedin_url,
        company_name=user_in.company_name,
        designation=user_in.designation,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


class ResetPasswordRequest(BaseModel):
    email: str
    role: str


@router.post("/reset-password")
async def reset_password(
    *,
    db: AsyncSession = Depends(deps.get_db),
    body: ResetPasswordRequest,
) -> Any:
    """
    Reset password for a user. Generates a temporary password and emails it.
    """
    import secrets
    import string
    from app.core.email import send_password_reset_email

    try:
        user_role = UserRole(body.role.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {body.role}")

    stmt = select(User).where(User.email == body.email, User.role == user_role)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email and role")

    # Generate temporary password
    alphabet = string.ascii_letters + string.digits
    temp_password = ''.join(secrets.choice(alphabet) for _ in range(8))

    user.hashed_password = security.get_password_hash(temp_password)
    await db.commit()

    # Send email
    email_sent = send_password_reset_email(body.email, temp_password, body.role)

    if email_sent:
        return {"message": "A temporary password has been sent to your email address."}
    else:
        # Fallback for dev/demo when SMTP is not configured
        return {
            "message": "SMTP not configured. Here is your temporary password (dev mode only).",
            "temporary_password": temp_password,
        }

