from sqlalchemy import Boolean, Column, Integer, String, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    CLIENT = "client"
    CANDIDATE = "candidate"

class User(Base):
    __table_args__ = (
        UniqueConstraint('email', 'role', name='uq_user_email_role'),
    )

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean(), default=True)
    role = Column(Enum(UserRole), default=UserRole.CANDIDATE)
    
    # Candidate Profile Data
    first_name = Column(String, nullable=True)
    middle_initial = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    work_permit_type = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    
    # Client Profile Data
    company_name = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    
    jobs = relationship("Job", back_populates="owner")
    applications = relationship("Application", back_populates="user")
