from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from app.models.user import UserRole
import re

US_STATES = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    "DC", "N/A (International)",
}

class UserBase(BaseModel):
    email: EmailStr
    is_active: Optional[bool] = True
    role: UserRole

class UserCreate(UserBase):
    password: str
    first_name: str
    last_name: str
    phone_number: str
    email: EmailStr # Explicitly include email for validation context if needed, though it's in UserBase
    
    # Candidate specific
    years_of_experience: Optional[int] = None
    work_permit_type: Optional[str] = None
    linkedin_url: Optional[str] = None

    # Client specific
    company_name: Optional[str] = None
    designation: Optional[str] = None
    
    # Optional fields for creation (if any)
    middle_initial: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

    @field_validator("first_name", "last_name")
    @classmethod
    def name_not_empty(cls, v: str, info) -> str:
        v = v.strip()
        if not v:
            raise ValueError(f"{info.field_name} is required")
        if not re.match(r"^[A-Za-z\s\-']+$", v):
            raise ValueError(f"{info.field_name} must contain only letters, spaces, hyphens, or apostrophes")
        return v

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"[\s\-\(\)\+]", "", v)
        if digits.startswith("1") and len(digits) == 11:
            digits = digits[1:]
        if not re.match(r"^\d{10}$", digits):
            raise ValueError("Phone number must be a valid 10-digit US number")
        return v.strip()

    @model_validator(mode='after')
    def validate_role_requirements(self) -> 'UserCreate':
        role = self.role
        
        if role == UserRole.CANDIDATE:
            if self.years_of_experience is None:
                raise ValueError("Years of experience is required for candidates")
            if not self.work_permit_type:
                raise ValueError("Work permit type is required for candidates")
            if not self.linkedin_url:
                raise ValueError("LinkedIn profile URL is required for candidates")
            
            # Validate specifics
            if self.years_of_experience < 0 or self.years_of_experience > 50:
                raise ValueError("Years of experience must be between 0 and 50")
            
            if self.linkedin_url and not re.match(r"^https?://(www\.)?linkedin\.com/in/[\w\-]+/?$", self.linkedin_url):
                 raise ValueError("Must be a valid LinkedIn profile URL (e.g. https://linkedin.com/in/yourname)")

        elif role == UserRole.CLIENT:
            if not self.company_name:
                raise ValueError("Company name is required for clients")
            if not self.designation:
                raise ValueError("Designation/Job Title is required for clients")
            
            # Allow optional fields to be ignored or set to None if passed
            # implementation detail: backend doesn't need to force them to None as DB columns are nullable
        
        return self

    @field_validator("city")
    @classmethod
    def validate_city(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if v and not re.match(r"^[A-Za-z\s\-]+$", v):
            raise ValueError("City must contain only letters, spaces, and hyphens")
        return v

    @field_validator("state")
    @classmethod
    def validate_state(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().upper()
        if v and v not in US_STATES:
            raise ValueError(f"State must be a valid US state abbreviation or N/A")
        return v

class UserUpdate(UserBase):
    password: Optional[str] = None
    email: Optional[EmailStr] = None # Allow updating email
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
    
    first_name: Optional[str] = None
    middle_initial: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    years_of_experience: Optional[int] = None
    work_permit_type: Optional[str] = None
    linkedin_url: Optional[str] = None
    
    company_name: Optional[str] = None
    designation: Optional[str] = None

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        digits = re.sub(r"[\s\-\(\)\+]", "", v)
        if digits.startswith("1") and len(digits) == 11:
            digits = digits[1:]
        if not re.match(r"^\d{10}$", digits):
            raise ValueError("Phone number must be a valid 10-digit US number")
        return v.strip()

    @field_validator("city")
    @classmethod
    def validate_city(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if v and not re.match(r"^[A-Za-z\s\-]+$", v):
            raise ValueError("City must contain only letters, spaces, and hyphens")
        return v

    @field_validator("state")
    @classmethod
    def validate_state(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().upper()
        if v and v not in US_STATES:
            raise ValueError(f"State must be a valid US state abbreviation or N/A")
        return v

    @field_validator("years_of_experience")
    @classmethod
    def validate_experience(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 0 or v > 50):
            raise ValueError("Years of experience must be between 0 and 50")
        return v

    @field_validator("linkedin_url")
    @classmethod
    def validate_linkedin(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if v and not re.match(r"^https?://(www\.)?linkedin\.com/in/[\w\-]+/?$", v):
            raise ValueError("Must be a valid LinkedIn profile URL (e.g. https://linkedin.com/in/yourname)")
        return v

class UserInDBBase(UserBase):
    id: int
    first_name: Optional[str] = None
    middle_initial: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    years_of_experience: Optional[int] = None
    work_permit_type: Optional[str] = None
    linkedin_url: Optional[str] = None
    company_name: Optional[str] = None
    designation: Optional[str] = None
    
    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    sub: Optional[str] = None

