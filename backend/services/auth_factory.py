import os
from backend.services import auth as auth_simple
from backend.services import auth_supabase

AUTH_PROVIDER = os.environ.get("AUTH_PROVIDER", "simple").lower()

def get_auth_service():
    if AUTH_PROVIDER == "supabase":
        return auth_supabase
    return auth_simple

# Export the chosen get_current_user dependency 
# Note: This approach might be tricky because dependencies are often evaluated at import time by FastAPI.
# However, we can use a wrapper dependency.

async def get_current_user(token=None, db=None):
    # This function signature is likely wrong because FastAPI passes dependencies differently.
    # Instead, we should expose the dependency directly.
    pass 

# Better approach for FastAPI dependency:
from fastapi import Depends
from backend.models import User

# We need to import get_db and security schemes to make the dependency work
# The dependency signature must match what FastAPI expects.

if AUTH_PROVIDER == "supabase":
    get_current_user = auth_supabase.get_current_user
else:
    get_current_user = auth_simple.get_current_user
