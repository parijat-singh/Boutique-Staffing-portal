from sqlalchemy.ext.asyncio import AsyncEngine
from app.db.base import Base
from app.db.session import engine
# Import all models to ensure they are registered on the Base
from app.models.user import User
from app.models.job import Job
from app.models.application import Application

async def init_db(db_engine: AsyncEngine):
    async with db_engine.begin() as conn:
        # Create tables
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully")
