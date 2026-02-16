"""Unit tests for authentication service."""

import os
import pytest

# Set JWT_SECRET_KEY before importing auth module
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only")

from backend.services.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
)


class TestPasswordHashing:
    """Test PBKDF2-SHA256 password hashing."""

    def test_hash_and_verify(self):
        """Should hash and verify a password correctly."""
        password = "secureP@ssw0rd!"
        hashed = get_password_hash(password)

        assert hashed != password
        assert verify_password(password, hashed) is True

    def test_wrong_password(self):
        """Should reject incorrect password."""
        hashed = get_password_hash("correct_password")
        assert verify_password("wrong_password", hashed) is False

    def test_unique_hashes(self):
        """Same password should produce different hashes (unique salt)."""
        h1 = get_password_hash("test")
        h2 = get_password_hash("test")
        assert h1 != h2

    def test_empty_password(self):
        """Should handle empty password."""
        hashed = get_password_hash("")
        assert verify_password("", hashed) is True
        assert verify_password("notempty", hashed) is False


class TestJWT:
    """Test JWT token creation and verification."""

    def test_create_and_decode_token(self):
        """Should create and decode a valid token."""
        token = create_access_token(data={"sub": "1", "username": "testuser"})
        payload = decode_access_token(token)

        assert payload["sub"] == "1"
        assert payload["username"] == "testuser"

    def test_token_contains_expiry(self):
        """Token payload should include exp."""
        token = create_access_token(data={"sub": "1", "username": "testuser"})
        payload = decode_access_token(token)

        assert "exp" in payload

    def test_invalid_token(self):
        """Should return None for invalid token."""
        result = decode_access_token("invalid.jwt.token")
        assert result is None
