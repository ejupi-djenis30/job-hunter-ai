import os
import logging
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from supabase import create_client, Client

from backend.database import get_db
from backend.models import User

logger = logging.getLogger(__name__)

# ─── Config ───
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.warning("Supabase credentials not found. Supabase auth will fail if used.")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {e}")
    supabase = None

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Verifies Supabase JWT, gets user from Supabase, then finds/creates local User record.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    token = credentials.credentials
    try:
        # Verify token with Supabase
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        sb_user = user_response.user
        sb_id = sb_user.id
        email = sb_user.email
        
        # Check if user exists locally
        user = db.query(User).filter(
            (User.supabase_id == sb_id) | (User.email == email)
        ).first()

        if not user:
            # Auto-register local user
            # Username defaults to part of email or random
            username = email.split("@")[0]
            # Ensure username uniqueness
            if db.query(User).filter(User.username == username).first():
                import uuid
                username = f"{username}_{uuid.uuid4().hex[:4]}"
            
            user = User(
                username=username,
                email=email,
                supabase_id=sb_id,
                hashed_password=None,  # Auth handled by Supabase
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif not user.supabase_id:
            # Link existing user by email
            user.supabase_id = sb_id
            db.commit()
            db.refresh(user)
            
        return user

    except Exception as e:
        logger.error(f"Supabase auth error: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# ─── Auth Ops ───
# These are just wrappers or placeholders since actual auth happens in frontend or via factory

def register(username: str, password: str):
    # Supabase register requires email. 
    # This might need adjustment if we want to support backend-side registration.
    raise HTTPException(status_code=400, detail="Use Supabase frontend SDK for registration")

def login(username: str, password: str):
    raise HTTPException(status_code=400, detail="Use Supabase frontend SDK for login")
