import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.api import auth, jobs, search, profiles, schedules
from backend.core.config import settings
from backend.core.exceptions import CoreException

# ─── Logging ───
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─── Lifespan ───
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    # Startup: create DB tables
    from backend.db.base import Base, engine
    from backend import models  # noqa: F401 — register models with metadata

    logger.info("Creating database tables if they don't exist…")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified.")

    # Startup: start scheduler
    from backend.services.scheduler import start_scheduler, stop_scheduler

    start_scheduler()

    yield

    # Shutdown: stop scheduler
    stop_scheduler()


# ─── App ───
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# ─── CORS ───
if settings.cors_origins_list:
    logger.info(f"Configuring CORS with origins: {settings.cors_origins_list}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.cors_origins_list],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    logger.warning("CORS_ORIGINS is empty — CORS middleware not added!")


# ─── Exception Handlers ───
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(status_code=422, content={"detail": exc.errors(), "message": "Validation Error"})


@app.exception_handler(CoreException)
async def core_exception_handler(request, exc):
    return JSONResponse(status_code=400, content={"detail": str(exc), "message": "Application Error"})


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


# ─── Routes ───
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(jobs.router, prefix=f"{settings.API_V1_STR}/jobs", tags=["jobs"])
app.include_router(search.router, prefix=f"{settings.API_V1_STR}/search", tags=["search"])
app.include_router(profiles.router, prefix=f"{settings.API_V1_STR}/profiles", tags=["profiles"])
app.include_router(schedules.router, prefix=f"{settings.API_V1_STR}/schedules", tags=["schedules"])


@app.get(f"{settings.API_V1_STR}/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "message": "Job Hunter AI API",
        "database": settings.DATABASE_URL.split("://")[0] if settings.DATABASE_URL else "unknown",
    }
