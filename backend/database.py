"""
Database configuration — supports SQLite (default) and PostgreSQL.

Set DATABASE_URL in your environment:
  SQLite:      sqlite:///./job_hunter.db       (default, zero-config)
  PostgreSQL:  postgresql://user:pass@host:5432/dbname
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./job_hunter.db")

# ─── Engine configuration ───
_is_sqlite = DATABASE_URL.startswith("sqlite")

_engine_kwargs: dict = {}

if _is_sqlite:
    # SQLite needs this for FastAPI's threaded request handling
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL connection pool settings
    _engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,       # verify connections before use
        "pool_recycle": 300,          # recycle connections after 5 min
    })

engine = create_engine(DATABASE_URL, **_engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session, closes on teardown."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
