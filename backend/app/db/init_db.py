from sqlalchemy.ext.asyncio import AsyncEngine
from app.db.base import Base
from app.db.session import engine
# Import all models to ensure they are registered on the Base
from app.models.user import User
from app.models.job import Job
from app.models.application import Application

async def init_db(db_engine: AsyncEngine):
    print("Initializing database tables...")
    try:
        async with db_engine.begin() as conn:
            # Create tables
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables created successfully")

        # Create First Superuser
        from sqlalchemy import select
        from app.models.user import User, UserRole
        from app.core.config import settings
        from app.core.security import get_password_hash

        if settings.FIRST_SUPERUSER and settings.FIRST_SUPERUSER_PASSWORD:
            async with db_engine.begin() as conn:
                # We need a session context effectively, or just execute raw SQL, but models are easier.
                # Since db_engine.begin() gives a connection, we can use it. 
                # Ideally, we should use a session for ORM usage. 
                pass 
                
        # To use ORM properly for data insertion, let's create a session
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy.orm import sessionmaker
        
        async_session = sessionmaker(
            db_engine, class_=AsyncSession, expire_on_commit=False
        )

        async with async_session() as session:
            if settings.FIRST_SUPERUSER and settings.FIRST_SUPERUSER_PASSWORD:
                query = select(User).where(User.email == settings.FIRST_SUPERUSER)
                result = await session.execute(query)
                user = result.scalars().first()
                
                if not user:
                    print(f"Creating first superuser: {settings.FIRST_SUPERUSER}")
                    user = User(
                        email=settings.FIRST_SUPERUSER,
                        hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                        role=UserRole.ADMIN,
                        first_name="Super",
                        last_name="Admin",
                        is_active=True
                    )
                    session.add(user)
                    await session.commit()
                    print("First superuser created")
                else:
                    print(f"First superuser {settings.FIRST_SUPERUSER} already exists")

    except Exception as e:
        print(f"Error during database initialization: {e}")
        print("Continuing startup... Application may error on first DB request.")
