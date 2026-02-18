from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.db.init_db import init_db
from app.db.session import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    await init_db(engine)
    yield

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# CORS — allow all origins for production stability
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1.api import api_router

from fastapi.staticfiles import StaticFiles
import os

# Create uploads directory if it doesn't exist
if not os.path.exists("uploads"):
    os.makedirs("uploads")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to Boutique Staffing Portal API"}

@app.get("/health")
def health_check():
    return {"status": "ok", "db_url": settings.DATABASE_URL}

