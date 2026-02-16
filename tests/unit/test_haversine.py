import pytest
import math
from backend.services.utils import haversine_distance

def test_haversine_distance_zero():
    """Distance between same points should be 0."""
    assert haversine_distance(47.3769, 8.5417, 47.3769, 8.5417) == 0.0

def test_haversine_distance_known():
    """Test known distance between Zurich and Bern approx 95km."""
    # Zurich
    lat1, lon1 = 47.3769, 8.5417
    # Bern
    lat2, lon2 = 46.9480, 7.4474
    
    dist = haversine_distance(lat1, lon1, lat2, lon2)
    # Expected approx 95-100km
    assert 90 < dist < 100

def test_haversine_distance_calculation():
    """Manual calculation verification."""
    # Simple case: 1 degree latitude change approx 111km
    lat1, lon1 = 0, 0
    lat2, lon2 = 1, 0
    dist = haversine_distance(lat1, lon1, lat2, lon2)
    assert 110 < dist < 112
