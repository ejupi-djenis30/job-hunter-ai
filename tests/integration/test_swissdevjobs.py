import pytest
import asyncio
from backend.providers.jobs.swissdevjobs.client import SwissDevJobsProvider
from backend.providers.jobs.models import JobSearchRequest, WorkForm, LanguageSkillRequest

@pytest.mark.asyncio
async def test_advanced_search():
    provider = SwissDevJobsProvider(include_raw_data=False)

    # Test 1: Search React, English Language
    req1 = JobSearchRequest(
        query="React frontend",
        language_skills=[LanguageSkillRequest(language_code="en")],
        page=0,
        page_size=5
    )
    res1 = await provider.search(req1)
    assert res1.total_count >= 0
    
    # Test 2: Search React, German Language
    req2 = JobSearchRequest(
        query="React frontend",
        language_skills=[LanguageSkillRequest(language_code="de")],
        page=0,
        page_size=5
    )
    res2 = await provider.search(req2)
    assert res2.total_count >= 0

    # Test 3: Search React, Remote only, Full Time
    req3 = JobSearchRequest(
        query="React",
        work_forms=[WorkForm.HOME_OFFICE],
        workload_min=100,
        page=0,
        page_size=5
    )
    res3 = await provider.search(req3)
    assert res3.total_count >= 0
    if res3.items:
        assert res3.items[0].title

    await provider.close()
