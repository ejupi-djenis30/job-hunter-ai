import uvicorn
import os
import sys

# Add current directory to sys.path to ensure backend package is found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
