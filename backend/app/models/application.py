from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, Enum, Text, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum

class ApplicationStatus(str, enum.Enum):
    APPLIED = "APPLIED"
    REVIEWING = "REVIEWING"
    INTERVIEW = "INTERVIEW"
    OFFER = "OFFER"
    REJECTED = "REJECTED"

class Application(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("job.id"), nullable=False)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.APPLIED)
    resume_path = Column(String, nullable=True)
    ai_score = Column(Integer, nullable=True)
    ai_analysis = Column(Text, nullable=True) # JSON string
    is_reviewed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")

    __table_args__ = (
        UniqueConstraint('user_id', 'job_id', name='uq_application_user_job'),
    )
