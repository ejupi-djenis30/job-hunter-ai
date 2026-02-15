"""Authentication routes — register and login."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import get_db
from backend.services.auth import (
    hash_password, verify_password, create_access_token,
)


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/config")
def get_auth_config():
    """Return public auth configuration."""
    import os
    provider = os.environ.get("AUTH_PROVIDER", "simple").lower()
    return {
        "provider": provider,
        "supabase_url": os.environ.get("SUPABASE_URL") if provider == "supabase" else None,
        "supabase_key": os.environ.get("SUPABASE_KEY") if provider == "supabase" else None,
    }



@router.post("/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user and return a JWT token."""
    existing = db.query(models.User).filter(
        models.User.username == user.username
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    db_user = models.User(
        username=user.username,
        hashed_password=hash_password(user.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    token = create_access_token(db_user.id, db_user.username)
    return {"access_token": token, "token_type": "bearer", "username": db_user.username}


@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login and get a JWT token."""
    db_user = db.query(models.User).filter(
        models.User.username == user.username
    ).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(db_user.id, db_user.username)
    return {"access_token": token, "token_type": "bearer", "username": db_user.username}
