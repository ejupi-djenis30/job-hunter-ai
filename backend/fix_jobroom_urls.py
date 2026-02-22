import sys
import os

sys.path.append(os.getcwd())

from backend.core.database import SessionLocal
from backend.models import ScrapedJob

def main():
    db = SessionLocal()
    jobs = db.query(ScrapedJob).filter(ScrapedJob.platform == "job_room").all()
    
    count = 0
    for job in jobs:
        if job.raw_metadata:
            raw = job.raw_metadata
            adv = raw.get("jobAdvertisement", raw)
            content = adv.get("jobContent", {})
            
            apply_data = content.get("applyChannel") or {}
            form_url = apply_data.get("formUrl") or content.get("externalUrl")
            
            if form_url and not job.application_url:
                job.application_url = form_url
                count += 1
                
    db.commit()
    print(f"Updated {count} application URLs.")
    db.close()

if __name__ == "__main__":
    main()
