import math
import pytest
from fastapi import UploadFile, HTTPException
from backend.services.utils import clean_html_tags, haversine_distance

def test_clean_html_tags_empty():
    assert clean_html_tags("") == ""
    assert clean_html_tags(None) == ""

def test_clean_html_tags_basic():
    html_input = "<p>This is a <b>bold</b> statement.</p>"
    expected = "This is a bold statement."
    assert clean_html_tags(html_input) == expected

def test_clean_html_tags_entities():
    html_input = "Python &amp; Java&nbsp;Developer &lt;100%&gt;"
    expected = "Python & Java Developer <100%>"
    assert clean_html_tags(html_input) == expected

def test_haversine_distance_same_point():
    # Distance from Zurich to Zurich
    zrh_lat = 47.3769
    zrh_lon = 8.5417
    dist = haversine_distance(zrh_lat, zrh_lon, zrh_lat, zrh_lon)
    assert math.isclose(dist, 0.0, abs_tol=0.1)

def test_haversine_distance_known_points():
    # Distance from Zurich to Bern is approx 95-100km
    zrh_lat, zrh_lon = 47.3769, 8.5417
    bern_lat, bern_lon = 46.9480, 7.4474
    dist = haversine_distance(zrh_lat, zrh_lon, bern_lat, bern_lon)
    assert 90.0 < dist < 100.0

@pytest.mark.asyncio
async def test_extract_text_from_file_txt():
    from io import BytesIO
    content = b"Hello World"
    mock_file = UploadFile(filename="test.txt", file=BytesIO(content))
    # We need to mock the content_type or just rely on filename check in the service
    text = await clean_text_from_upload(mock_file)
    assert text == "Hello World"

@pytest.mark.asyncio
async def test_extract_text_from_file_unsupported():
    mock_file = UploadFile(filename="test.exe", file=None)
    from backend.services.utils import extract_text_from_file
    with pytest.raises(HTTPException) as excinfo:
        await extract_text_from_file(mock_file)
    assert excinfo.value.status_code == 400
    assert "Unsupported file type" in excinfo.value.detail

async def clean_text_from_upload(file: UploadFile) -> str:
    """Helper to bypass some fastAPI UploadFile quirks in tests if needed, 
    but let's try calling it directly first."""
    from backend.services.utils import extract_text_from_file
    return await extract_text_from_file(file)

@pytest.mark.asyncio
async def test_extract_text_from_file_pdf_error():
    # Invalid PDF content
    mock_file = UploadFile(filename="test.pdf", file=None)
    # Mocking read() to return invalid bytes
    mock_file.read = lambda: (async_return(b"not a pdf"))
    
    from backend.services.utils import extract_text_from_file
    with pytest.raises(HTTPException) as excinfo:
        await extract_text_from_file(mock_file)
    assert excinfo.value.status_code == 400
    assert "Failed to process file" in excinfo.value.detail

async def async_return(val):
    return val
