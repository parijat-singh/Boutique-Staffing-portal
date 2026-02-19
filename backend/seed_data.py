import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from sqlalchemy import select

async def seed_data():
    async with AsyncSessionLocal() as db:
        stmt = select(User).where(User.email == "admin@bsportal.com", User.role == UserRole.ADMIN)
        result = await db.execute(stmt)
        user = result.scalars().first()
        
        if not user:
            print("Creating admin user...")
            admin_user = User(
                email="admin@bsportal.com",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin_user)
            await db.commit()
            print("Admin user created: admin@bsportal.com / admin123")
        else:
            print("Admin user already exists.")

        stmt = select(User).where(User.email == "client@bsportal.com", User.role == UserRole.CLIENT)
        result = await db.execute(stmt)
        user = result.scalars().first()
        
        if not user:
            print("Creating client user...")
            client_user = User(
                email="client@bsportal.com",
                hashed_password=get_password_hash("client123"),
                role=UserRole.CLIENT,
                is_active=True
            )
            db.add(client_user)
            await db.commit()
            print("Client user created: client@bsportal.com / client123")
        else:
            print("Client user already exists.")

        stmt = select(User).where(User.email == "candidate@bsportal.com", User.role == UserRole.CANDIDATE)
        result = await db.execute(stmt)
        user = result.scalars().first()
        
        if not user:
            print("Creating candidate user...")
            candidate_user = User(
                email="candidate@bsportal.com",
                hashed_password=get_password_hash("candidate123"),
                role=UserRole.CANDIDATE,
                is_active=True
            )
            db.add(candidate_user)
            await db.commit()
            print("Candidate user created: candidate@bsportal.com / candidate123")
        else:
            print("Candidate user already exists.")

        # Create sample job
        from app.models.job import Job
        stmt = select(Job).where(Job.title == "Senior Developer")
        result = await db.execute(stmt)
        job = result.scalars().first()
        
        if not job:
             stmt = select(User).where(User.email == "client@bsportal.com")
             result = await db.execute(stmt)
             client_user = result.scalars().first()
             
             if client_user:
                 print("Creating sample job...")
                 job = Job(
                     title="Senior Developer",
                     description="We are looking for an experienced developer.",
                     owner_id=client_user.id,
                     is_active=True,
                     location="Remote",
                     salary_range="$120k - $150k",
                     job_type="Full-time",
                     experience_level="Senior"
                 )
                 db.add(job)
                 await db.commit()
                 print("Sample job created.")

if __name__ == "__main__":
    asyncio.run(seed_data())

