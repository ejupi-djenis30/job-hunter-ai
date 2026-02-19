import asyncio
import logging
from backend.providers.jobs.swissdevjobs.client import SwissDevJobsProvider
from backend.providers.jobs.models import JobSearchRequest, WorkForm, LanguageSkillRequest

logging.basicConfig(level=logging.INFO)

async def test_advanced_search():
    provider = SwissDevJobsProvider(include_raw_data=False)

    print("\n--- Test 1: Search React, English Language ---")
    req1 = JobSearchRequest(
        query="React frontend",
        language_skills=[LanguageSkillRequest(language_code="en")],
        page=0,
        page_size=5
    )
    res1 = await provider.search(req1)
    print(f"Total found (EN): {res1.total_count}")
    
    print("\n--- Test 2: Search React, German Language ---")
    req2 = JobSearchRequest(
        query="React frontend",
        language_skills=[LanguageSkillRequest(language_code="de")],
        page=0,
        page_size=5
    )
    res2 = await provider.search(req2)
    print(f"Total found (DE): {res2.total_count}")

    print("\n--- Test 3: Search React, Remote only, Full Time ---")
    req3 = JobSearchRequest(
        query="React",
        work_forms=[WorkForm.HOME_OFFICE],
        workload_min=100,
        page=0,
        page_size=5
    )
    res3 = await provider.search(req3)
    print(f"Total found (Remote Full-Time): {res3.total_count}")
    if res3.items:
        print(f"Sample: {res3.items[0].title} at {res3.items[0].company.name if res3.items[0].company else 'N/A'}")

    await provider.close()

if __name__ == "__main__":
    asyncio.run(test_advanced_search())
