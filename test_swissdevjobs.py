import asyncio
import logging
from backend.providers.jobs.swissdevjobs.client import SwissDevJobsProvider
from backend.providers.jobs.models import JobSearchRequest, RadiusSearchRequest, Coordinates

logging.basicConfig(level=logging.INFO)

async def test_search():
    provider = SwissDevJobsProvider(include_raw_data=False)
    
    # Test 1: Health check
    print("--- Test 1: Health check ---")
    health = await provider.health_check()
    print(f"Health: {health.status} ({health.latency_ms}ms)")
    print(health)

    # Test 2: Standard keywords search
    print("\n--- Test 2: Search for 'React' in 'Zurich' ---")
    req1 = JobSearchRequest(
        query="React",
        location="Zurich",
        page=0,
        page_size=2
    )
    res1 = await provider.search(req1)
    print(f"Total found: {res1.total_count}")
    print(f"Returned items: {len(res1.items)}")
    for item in res1.items:
        print(f" - {item.title} @ {item.company.name} ({item.location.city})")
        print(f"   URL: {item.external_url}")
        print(f"   Email: {item.application.email if item.application else 'N/A'}")
        raw_desc = item.descriptions[0].description if item.descriptions else ""
        print(f"   Desc length: {len(raw_desc)}")
        print("   ---")

    await provider.close()

if __name__ == "__main__":
    asyncio.run(test_search())
