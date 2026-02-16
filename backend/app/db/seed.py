"""Seed script — run inside the backend container or with the right DATABASE_URL.

Usage:
    docker compose exec backend python -m app.db.seed

Creates a default admin user if none exists.
"""
import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


async def seed():
    async with AsyncSessionLocal() as db:
        # Check if an admin already exists
        result = await db.execute(select(User).where(User.role == UserRole.ADMIN))
        admin = result.scalars().first()
        if admin:
            print(f"Admin already exists: {admin.email}")
            return

        admin_user = User(
            email="admin@boutiquestaffing.com",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True,
            first_name="Admin",
            last_name="User",
        )
        db.add(admin_user)
        await db.commit()
        print("Created admin user: admin@boutiquestaffing.com / admin123")


if __name__ == "__main__":
    asyncio.run(seed())
