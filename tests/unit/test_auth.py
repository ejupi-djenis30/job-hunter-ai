"""Unit tests for authentication service."""

import os
import pytest

# Set JWT_SECRET_KEY before importing auth module
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only")

from backend.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
)


class TestPasswordHashing:
    """Test PBKDF2-SHA256 password hashing."""

    def test_hash_and_verify(self):
        """Should hash and verify a password correctly."""
        password = "secureP@ssw0rd!"
        hashed = hash_password(password)

        assert hashed != password
        assert verify_password(password, hashed) is True

    def test_wrong_password(self):
        """Should reject incorrect password."""
        hashed = hash_password("correct_password")
        assert verify_password("wrong_password", hashed) is False

    def test_unique_hashes(self):
        """Same password should produce different hashes (unique salt)."""
        h1 = hash_password("test")
        h2 = hash_password("test")
        assert h1 != h2

    def test_empty_password(self):
        """Should handle empty password."""
        hashed = hash_password("")
        assert verify_password("", hashed) is True
        assert verify_password("notempty", hashed) is False

    def test_hash_format(self):
        """Hash should be in 'salt:key' format."""
        hashed = hash_password("test")
        assert ":" in hashed
        parts = hashed.split(":", 1)
        assert len(parts) == 2


class TestJWT:
    """Test JWT token creation and verification."""

    def test_create_and_decode_token(self):
        """Should create and decode a valid token."""
        token = create_access_token(user_id=1, username="testuser")
        payload = decode_token(token)

        assert payload["sub"] == "1"
        assert payload["username"] == "testuser"

    def test_token_contains_expiry(self):
        """Token payload should include exp and iat."""
        token = create_access_token(user_id=1, username="testuser")
        payload = decode_token(token)

        assert "exp" in payload
        assert "iat" in payload

    def test_invalid_token(self):
        """Should raise HTTPException for invalid token."""
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            decode_token("invalid.jwt.token")
        assert exc_info.value.status_code == 401
