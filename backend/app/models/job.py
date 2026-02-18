from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Job(Base):
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True) # Must-have
    nice_to_have_requirements = Column(Text, nullable=True) # Desired
    location = Column(String, nullable=True)
    salary_range = Column(String, nullable=True)
    job_type = Column(String, nullable=True) # e.g. Full-time, Contract
    experience_level = Column(String, nullable=True) # e.g. Junior, Senior
    is_active = Column(Boolean(), default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    owner_id = Column(Integer, ForeignKey("user.id"))
    owner = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job")
