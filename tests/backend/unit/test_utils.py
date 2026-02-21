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
