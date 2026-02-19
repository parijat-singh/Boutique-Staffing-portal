
import asyncio
from app.db.session import AsyncSessionLocal
from app.models.job import Job
from sqlalchemy import select

async def check_jobs():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Job))
        jobs = result.scalars().all()
        print(f"Total jobs found: {len(jobs)}")
        for job in jobs:
            print(f"ID: {job.id}, Title: {job.title}, Active: {job.is_active}, Owner: {job.owner_id}")

if __name__ == "__main__":
    asyncio.run(check_jobs())
