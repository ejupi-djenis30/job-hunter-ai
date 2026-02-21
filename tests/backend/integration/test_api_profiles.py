import pytest

class TestAdvancedProfilesAPI:
    def test_get_profiles_empty_or_populated(self, client, auth_headers):
        response = client.get("/api/v1/profiles/", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_create_profile_valid(self, client, auth_headers):
        payload = {
            "name": "Integration Test Profile Full",
            "role_description": "Senior DevOps Engineer",
            "cv_content": "Docker, Kubernetes, AWS, Python",
            "search_strategy": "Ignore junior roles",
            "location_filter": "Zurich",
            "max_distance": 50,
            "workload_filter": "80-100",
            "max_queries": 5,
            "scrape_mode": "sequential"
        }
        response = client.post("/api/v1/search/start", json=payload, headers=auth_headers)
        assert response.status_code == 200
        assert "profile_id" in response.json()
    
    def test_get_profiles_unauthorized(self, client):
        response = client.get("/api/v1/profiles/")
        assert response.status_code == 401 # Unauthorized missing token

    def test_create_profile_validation_failure(self, client, auth_headers):
        # Invalid data types
        payload = {
            "name": 12345, # Should be explicitly string or coerced
            "max_distance": "NOT A NUMBER" 
        }
        response = client.post("/api/v1/search/start", json=payload, headers=auth_headers)
        assert response.status_code == 422 # Unprocessable Entity
