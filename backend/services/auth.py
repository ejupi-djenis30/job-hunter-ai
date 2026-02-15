"""
Authentication service — JWT tokens + password hashing.
Uses PBKDF2-SHA256 (stdlib) for password hashing to avoid bcrypt version conflicts.
"""
import os
import jwt
import hashlib
import secrets
import logging
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.database import get_db
from backend import models

logger = logging.getLogger(__name__)

# ─── Config ───
SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY environment variable is not set. "
        "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 72

# ─── Security ───
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash password using PBKDF2-SHA256 (stdlib, no external deps)."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"{salt}:{key.hex()}"


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password against stored hash."""
    try:
        salt, stored_key = hashed.split(":", 1)
        key = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt.encode(), 100000)
        return key.hex() == stored_key
    except Exception:
        return False


# ─── JWT ───
def create_access_token(user_id: int, username: str) -> str:
    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ─── FastAPI Dependency ───
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    """Dependency that extracts and validates the current user from JWT."""
    payload = decode_token(credentials.credentials)
    user_id = int(payload["sub"])
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
