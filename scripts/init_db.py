
import sys
import os
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from backend.db.base import Base, engine
# Import models so they are registered with Base
from backend import models 

def init():
    print("Creating database tables...")
    try:
        if os.path.exists("job_hunter.db"):
            os.remove("job_hunter.db")
            print("Removed existing job_hunter.db")
        
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init()
