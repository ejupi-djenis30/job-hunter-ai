"""
Job Hunter AI — FastAPI Application

Self-hosted, AI-powered Swiss job search platform.
Supports SQLite (default) and PostgreSQL backends.
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv("backend/.env")

# ─── Logging ───
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ─── Database setup ───
from backend import models, database  # noqa: E402

models.Base.metadata.create_all(bind=database.engine)

# ─── Scheduler lifecycle ───
from backend.services.scheduler import start_scheduler, stop_scheduler  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    logger.info("Application started")
    yield
    stop_scheduler()
    logger.info("Application stopped")


# ─── App ───
app = FastAPI(
    title="Job Hunter AI",
    description="AI-powered Swiss job search platform",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ───
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ───
from backend.routes import auth, jobs, search, profiles  # noqa: E402

app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(search.router)
app.include_router(profiles.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Job Hunter AI Backend is running",
        "database": "postgresql" if not database._is_sqlite else "sqlite",
    }
