
import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.job import Job

async def verify_data():
    async with AsyncSessionLocal() as db:
        print("--- USERS ---")
        stmt = select(User)
        result = await db.execute(stmt)
        users = result.scalars().all()
        for u in users:
            print(f"ID: {u.id} | Email: {u.email} | Role: {u.role} | Active: {u.is_active}")

        print("\n--- JOBS ---")
        stmt = select(Job)
        result = await db.execute(stmt)
        jobs = result.scalars().all()
        for j in jobs:
            print(f"ID: {j.id} | Title: {j.title} | OwnerID: {j.owner_id} | Active: {j.is_active}")

if __name__ == "__main__":
    asyncio.run(verify_data())
