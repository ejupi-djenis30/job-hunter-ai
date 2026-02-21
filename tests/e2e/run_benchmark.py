
import asyncio
import time
import httpx
import sys
import logging
from datetime import datetime

# Setup basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("benchmark")

BASE_URL = "http://localhost:8000/api/v1"

async def run_benchmark():
    async with httpx.AsyncClient(timeout=60.0) as client:
        logger.info("Starting E2E Benchmark...")
        start_global = time.perf_counter()

        # 1. Health/Root Check
        try:
            t0 = time.perf_counter()
            resp = await client.get("http://localhost:8000/")
            resp.raise_for_status()
            logger.info(f"[OK] Root/Health check: {time.perf_counter() - t0:.4f}s")
        except Exception as e:
            logger.error(f"[FAIL] Root check failed: {e}")
            sys.exit(1)

        # 2. Register & Login
        username = f"benchuser_{int(time.time())}"
        password = "BenchPassword123!"
        
        t0 = time.perf_counter()
        resp = await client.post(f"{BASE_URL}/auth/register", json={"username": username, "password": password})
        if resp.status_code != 200:
            logger.error(f"Registration failed: {resp.text}")
            sys.exit(1)
        logger.info(f"[OK] Registration: {time.perf_counter() - t0:.4f}s")

        t0 = time.perf_counter()
        resp = await client.post(f"{BASE_URL}/auth/login", data={"username": username, "password": password})
        if resp.status_code != 200:
            logger.error(f"Login failed: {resp.text}")
            sys.exit(1)
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        logger.info(f"[OK] Login: {time.perf_counter() - t0:.4f}s")

        # 3. Create Search Profile (Start Search)
        t0 = time.perf_counter()
        # Using a keyword that will likely return results but not too broad
        search_req = {
            "name": "Benchmark Search",
            "role_description": "We are looking for a Python Developer in Zurich.",
            "search_strategy": "Find Python jobs",
            "location_filter": "Zürich"
        }
        resp = await client.post(f"{BASE_URL}/search/start", json=search_req, headers=headers)
        if resp.status_code != 200:
            logger.error(f"Search start failed: {resp.text}")
            sys.exit(1)
        
        profile_id = resp.json().get("profile_id")
        logger.info(f"[OK] Search Started (Profile ID: {profile_id}): {time.perf_counter() - t0:.4f}s")

        # 4. Poll for Search Completion
        logger.info("Polling for search completion (timeout=60s)...")
        wait_start = time.perf_counter()
        completed = False
        
        while time.perf_counter() - wait_start < 60:
            t_poll = time.perf_counter()
            resp = await client.get(f"{BASE_URL}/search/status/{profile_id}", headers=headers)
            status = resp.json()
            
            state = status.get("state")
            jobs_found = status.get("jobs_found", 0)
            jobs_new = status.get("jobs_new", 0)
            
            if state == "done":
                logger.info(f"[DONE] Search completed in {time.perf_counter() - wait_start:.4f}s")
                logger.info(f"       Stats: Found={jobs_found}, New={jobs_new}, Duplicates={status.get('jobs_duplicates')}")
                completed = True
                break
            elif state == "error":
                logger.error(f"[FAIL] Search failed with error: {status.get('error')}")
                sys.exit(1)
            
            await asyncio.sleep(1.0) # Poll interval

        if not completed:
            logger.error("[FAIL] Search timed out after 60s")
            sys.exit(1)

        # 5. Fetch Jobs
        t0 = time.perf_counter()
        resp = await client.get(f"{BASE_URL}/jobs/", headers=headers)
        if resp.status_code != 200:
             logger.error(f"Fetch jobs failed: {resp.text}")
        
        jobs = resp.json()
        logger.info(f"[OK] Fetched {len(jobs)} jobs: {time.perf_counter() - t0:.4f}s")
        
        if jobs:
            # Check distance calculation if present
            job = jobs[0]
            dist = job.get("distance_km")
            logger.info(f"       Sample Job: {job.get('title')} | Distance: {dist} km")

        total_time = time.perf_counter() - start_global
        logger.info(f"\n✅ Benchmark Complete. Total Time: {total_time:.4f}s")

if __name__ == "__main__":
    try:
        asyncio.run(run_benchmark())
    except KeyboardInterrupt:
        pass
