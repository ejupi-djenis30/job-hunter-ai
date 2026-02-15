"""Unit tests for database configuration and auto-detection."""

import os
import pytest


class TestDatabaseConfig:
    """Test database.py configuration logic."""

    def test_default_is_sqlite(self):
        """Default DATABASE_URL should produce a SQLite engine."""
        from backend.database import _is_sqlite, DATABASE_URL
        assert _is_sqlite is True
        assert "sqlite" in DATABASE_URL

    def test_get_db_yields_session(self):
        """get_db should yield a session and close it."""
        from backend.database import get_db
        gen = get_db()
        session = next(gen)
        assert session is not None
        # Cleanup
        try:
            next(gen)
        except StopIteration:
            pass

    def test_engine_can_connect(self):
        """Engine should be able to establish a connection."""
        from sqlalchemy import text
        from backend.database import engine
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            row = result.fetchone()
            assert row[0] == 1

    def test_base_has_metadata(self):
        """Base should have metadata with our tables after model import."""
        from backend.database import Base
        from backend import models  # noqa: F401
        table_names = list(Base.metadata.tables.keys())
        assert "users" in table_names
        assert "jobs" in table_names
        assert "search_profiles" in table_names


class TestDatabaseAutoDetect:
    """Test the SQLite/PostgreSQL auto-detection logic."""

    def test_sqlite_detection(self):
        """sqlite:// URLs should be detected as SQLite."""
        from backend.database import _is_sqlite, DATABASE_URL
        if DATABASE_URL.startswith("sqlite"):
            assert _is_sqlite is True

    def test_session_local_creates_sessions(self):
        """SessionLocal should create usable sessions."""
        from backend.database import SessionLocal
        session = SessionLocal()
        assert session is not None
        session.close()
