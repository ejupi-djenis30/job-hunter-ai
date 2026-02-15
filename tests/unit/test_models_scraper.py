"""Unit tests for scraper data models."""

import pytest
from pydantic import ValidationError

from backend.scraper.core.models import (
    JobSearchRequest,
    JobListing,
    JobLocation,
    CompanyInfo,
    EmploymentDetails,
    ContractType,
    WorkForm,
    SortOrder,
    GeoPoint,
    RadiusSearchRequest,
    LanguageSkillFilter,
    LanguageLevel,
    JobSearchResponse,
)


class TestJobSearchRequest:
    """Test JobSearchRequest validation."""

    def test_minimal_request(self):
        """Should create a valid request with defaults."""
        request = JobSearchRequest()
        assert request.page == 0
        assert request.page_size == 20
        assert request.workload_min == 10
        assert request.workload_max == 100
        assert request.sort == SortOrder.DATE_DESC
        assert request.language == "en"

    def test_full_request(self):
        """Should create a request with all fields."""
        request = JobSearchRequest(
            query="Software Engineer",
            location="Zürich",
            workload_min=80,
            workload_max=100,
            contract_type=ContractType.PERMANENT,
            page=2,
            page_size=50,
            sort=SortOrder.RELEVANCE,
        )
        assert request.query == "Software Engineer"
        assert request.location == "Zürich"
        assert request.workload_min == 80
        assert request.contract_type == ContractType.PERMANENT
        assert request.page == 2

    def test_workload_validation(self):
        """Should reject workload_max < workload_min."""
        with pytest.raises(ValidationError):
            JobSearchRequest(workload_min=80, workload_max=50)

    def test_page_size_bounds(self):
        """Should reject page_size outside valid range."""
        with pytest.raises(ValidationError):
            JobSearchRequest(page_size=0)
        with pytest.raises(ValidationError):
            JobSearchRequest(page_size=200)

    def test_keywords_list(self):
        """Should accept multiple keywords."""
        request = JobSearchRequest(keywords=["python", "fastapi", "backend"])
        assert len(request.keywords) == 3

    def test_radius_search(self):
        """Should accept radius search parameters."""
        request = JobSearchRequest(
            radius_search=RadiusSearchRequest(
                geoPoint=GeoPoint(lat=47.3769, lon=8.5417),
                distance=30,
            )
        )
        assert request.radius_search is not None
        assert request.radius_search.distance == 30

    def test_language_skill_filter(self):
        """Should accept language skill filters."""
        request = JobSearchRequest(
            language_skills=[
                LanguageSkillFilter(
                    language_code="de",
                    spoken_level=LanguageLevel.FLUENT,
                )
            ]
        )
        assert len(request.language_skills) == 1

    def test_work_forms(self):
        """Should accept work form filters."""
        request = JobSearchRequest(
            work_forms=[WorkForm.HOME_WORK, WorkForm.SHIFT_WORK]
        )
        assert len(request.work_forms) == 2


class TestJobListing:
    """Test JobListing creation and validation."""

    def test_minimal_listing(self):
        """Should create a listing with required fields."""
        listing = JobListing(
            id="test-123",
            source="job_room",
            title="Test Job",
            company=CompanyInfo(name="Test Co"),
            location=JobLocation(city="Zürich"),
            employment=EmploymentDetails(),
        )
        assert listing.id == "test-123"
        assert listing.title == "Test Job"
        assert listing.company.name == "Test Co"
        assert listing.location.city == "Zürich"

    def test_anonymous_company(self):
        """Should handle anonymous company listings."""
        company = CompanyInfo(name=None)
        assert company.name == "Anonymous / Chiffre"

    def test_default_employment(self):
        """Should use sensible defaults for employment details."""
        emp = EmploymentDetails()
        assert emp.is_permanent is True
        assert emp.workload_min == 100
        assert emp.workload_max == 100


class TestJobSearchResponse:
    """Test JobSearchResponse pagination."""

    def test_has_more_pages(self):
        """Should correctly detect more pages."""
        response = JobSearchResponse(
            total_count=100,
            page=0,
            page_size=20,
            total_pages=5,
            source="job_room",
        )
        assert response.has_more is True

    def test_last_page(self):
        """Should detect last page."""
        response = JobSearchResponse(
            total_count=100,
            page=4,
            page_size=20,
            total_pages=5,
            source="job_room",
        )
        assert response.has_more is False

    def test_empty_response(self):
        """Should handle empty results."""
        response = JobSearchResponse(
            total_count=0,
            page=0,
            page_size=20,
            total_pages=0,
            source="job_room",
        )
        assert len(response.items) == 0
        assert response.has_more is False
