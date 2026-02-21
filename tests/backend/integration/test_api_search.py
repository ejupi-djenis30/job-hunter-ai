import pytest

class TestAdvancedSearchAPI:
    def test_get_search_status_all(self, client, auth_headers):
        response = client.get("/api/v1/search/status/all", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)

    def test_upload_cv_unsupported_format(self, client, auth_headers):
        # Create a dummy image file which is unsupported
        files = {
            "file": ("image.png", b"dummy image content", "image/png")
        }
        response = client.post("/api/v1/search/upload-cv", headers=auth_headers, files=files)
        assert response.status_code == 400
        assert "Unsupported file type" in response.json()["detail"]

    def test_upload_cv_text_format(self, client, auth_headers):
        files = {
            "file": ("resume.txt", b"Here is my curriculum vitae: I am an engineer.", "text/plain")
        }
        response = client.post("/api/v1/search/upload-cv", headers=auth_headers, files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == "resume.txt"
        assert "engineer" in data["text"]
