"""Unit tests for BFS Location Mapper and Job-Room provider helpers."""

import pytest

from backend.scraper.core.exceptions import LocationNotFoundError
from backend.scraper.providers.job_room.mapper import BFSLocationMapper
from backend.scraper.providers.job_room.constants import CANTON_CODES, LANGUAGE_PARAMS
from backend.scraper.core.models import (
    JobSearchRequest,
    ContractType,
    SortOrder,
)


class TestBFSLocationMapper:
    """Test Swiss BFS location resolution."""

    @pytest.fixture
    def mapper(self):
        return BFSLocationMapper()

    # ─── City Name Resolution ───

    def test_resolve_zurich(self, mapper):
        """Should resolve Zürich to BFS code 261."""
        assert mapper.resolve("Zürich") == ["261"]

    def test_resolve_zurich_ascii(self, mapper):
        """Should resolve ASCII 'zurich' to BFS code 261."""
        assert mapper.resolve("zurich") == ["261"]

    def test_resolve_bern(self, mapper):
        assert mapper.resolve("Bern") == ["351"]

    def test_resolve_geneva_multilingual(self, mapper):
        """Should resolve Geneva in multiple languages."""
        assert mapper.resolve("geneva") == ["6621"]
        assert mapper.resolve("genève") == ["6621"]
        assert mapper.resolve("genf") == ["6621"]

    def test_resolve_basel(self, mapper):
        assert mapper.resolve("Basel") == ["2701"]

    def test_resolve_lugano(self, mapper):
        assert mapper.resolve("Lugano") == ["5192"]

    def test_resolve_case_insensitive(self, mapper):
        """Should be case-insensitive."""
        assert mapper.resolve("BERN") == ["351"]
        assert mapper.resolve("bErN") == ["351"]

    # ─── Postal Code Resolution ───

    def test_resolve_postal_code_zurich(self, mapper):
        """Should resolve Zürich postal codes."""
        assert mapper.resolve("8001") == ["261"]
        assert mapper.resolve("8005") == ["261"]

    def test_resolve_postal_code_bern(self, mapper):
        assert mapper.resolve("3000") == ["351"]

    def test_resolve_postal_code_geneva(self, mapper):
        assert mapper.resolve("1200") == ["6621"]

    # ─── Error Handling ───

    def test_resolve_unknown_location(self, mapper):
        """Should raise LocationNotFoundError for unknown locations."""
        with pytest.raises(LocationNotFoundError):
            mapper.resolve("Atlantis")

    def test_resolve_safe_unknown(self, mapper):
        """Should return empty list for unknown locations (no exception)."""
        assert mapper.resolve_safe("Atlantis") == []

    def test_resolve_empty_string(self, mapper):
        """Should return empty list for empty input."""
        assert mapper.resolve("") == []

    # ─── Partial Match ───

    def test_partial_match(self, mapper):
        """Should find partial matches."""
        # "st. gallen" is in the cache, "gallen" should partial-match
        codes = mapper.resolve("gallen")
        assert len(codes) > 0

    # ─── Reverse Lookup ───

    def test_reverse_lookup(self, mapper):
        """Should reverse-lookup BFS code to city info."""
        info = mapper.reverse_lookup("261")
        assert info is not None
        assert "zurich" in info.city.lower() or "zürich" in info.city.lower()

    def test_reverse_lookup_unknown(self, mapper):
        """Should return None for unknown BFS codes."""
        assert mapper.reverse_lookup("99999") is None


class TestConstants:
    """Test API constants."""

    def test_all_cantons_present(self):
        """All 26 Swiss cantons should be mapped."""
        assert len(CANTON_CODES) == 26

    def test_language_params(self):
        """All 4 languages should be mapped."""
        assert set(LANGUAGE_PARAMS.keys()) == {"en", "de", "fr", "it"}


class TestSearchPayloadBuilder:
    """Test payload building logic via JobRoomProvider."""

    def test_keywords_from_query(self):
        """Query string should be added to keywords list."""
        from backend.scraper.providers.job_room.client import JobRoomProvider

        provider = JobRoomProvider.__new__(JobRoomProvider)
        provider._mapper = BFSLocationMapper()

        request = JobSearchRequest(query="Python Developer")
        payload = provider._build_search_payload(request)

        assert "Python Developer" in payload["keywords"]

    def test_location_resolved_to_communal_codes(self):
        """Location should be resolved to BFS communal codes."""
        from backend.scraper.providers.job_room.client import JobRoomProvider

        provider = JobRoomProvider.__new__(JobRoomProvider)
        provider._mapper = BFSLocationMapper()

        request = JobSearchRequest(location="Zürich")
        payload = provider._build_search_payload(request)

        assert "261" in payload["communalCodes"]

    def test_permanent_contract_mapping(self):
        """Contract type should map to boolean."""
        from backend.scraper.providers.job_room.client import JobRoomProvider

        provider = JobRoomProvider.__new__(JobRoomProvider)
        provider._mapper = BFSLocationMapper()

        # Permanent
        request = JobSearchRequest(contract_type=ContractType.PERMANENT)
        payload = provider._build_search_payload(request)
        assert payload["permanent"] is True

        # Temporary
        request = JobSearchRequest(contract_type=ContractType.TEMPORARY)
        payload = provider._build_search_payload(request)
        assert payload["permanent"] is False

        # Any
        request = JobSearchRequest(contract_type=ContractType.ANY)
        payload = provider._build_search_payload(request)
        assert payload["permanent"] is None

    def test_url_building(self):
        """Search URL should include pagination and sort params."""
        from backend.scraper.providers.job_room.client import JobRoomProvider

        provider = JobRoomProvider.__new__(JobRoomProvider)
        provider._mapper = BFSLocationMapper()

        request = JobSearchRequest(page=2, page_size=50, sort=SortOrder.RELEVANCE)
        url = provider._build_search_url(request)

        assert "page=2" in url
        assert "size=50" in url
        assert "sort=relevance" in url
