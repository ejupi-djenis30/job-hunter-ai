import React, { useState, useEffect, useRef } from 'react';

export function LocationInput({
    location,
    latitude,
    longitude,
    onLocationChange
}) {
    const [query, setQuery] = useState(location || "");
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    // Sync local query if prop changes externaly (e.g. initial load)
    useEffect(() => {
        setQuery(location || "");
    }, [location]);

    // Close suggestions on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSearch = async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            // Limited to Switzerland (ch) for this app context, but can be global
            // Limited to Switzerland (ch) for this app context, but can be global
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&countrycodes=ch&addressdetails=1&limit=5`
            );
            const data = await response.json();

            // Format display names
            const formatted = data.map(item => {
                const addr = item.address || {};
                const city = addr.city || addr.town || addr.village || addr.municipality;
                const state = addr.state || addr.canton;
                let shortName = item.display_name;

                if (city && state) {
                    shortName = `${city}, ${state}`;
                } else if (city) {
                    shortName = city;
                }

                return { ...item, display_name: shortName, full_name: item.display_name };
            });

            setSuggestions(formatted);
            setShowSuggestions(true);
        } catch (error) {
            console.error("OSM Search Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query !== location) { // Only search if user typed something new
                handleSearch(query);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (item) => {
        setQuery(item.display_name);
        setShowSuggestions(false);
        onLocationChange({
            name: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
        });
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Reverse Geocoding
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();

                    const displayName = data.display_name || `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
                    setQuery(displayName);

                    onLocationChange({
                        name: displayName,
                        lat: latitude,
                        lon: longitude
                    });
                } catch (error) {
                    console.error("Reverse Geocoding Error:", error);
                    // Fallback to coordinates
                    onLocationChange({
                        name: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
                        lat: latitude,
                        lon: longitude
                    });
                } finally {
                    setIsLoading(false);
                }
            },
            (error) => {
                console.error("Geolocation Error:", error);
                alert("Unable to retrieve your location");
                setIsLoading(false);
            }
        );
    };

    return (
        <div className="position-relative" ref={wrapperRef}>
            <label className="form-label text-light">
                <i className="bi bi-geo-alt me-1"></i>Location
            </label>
            <div className="input-group">
                <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    placeholder="Search city or address..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        // Also update parent plain text immediately if they just type generic text
                        // but don't set lat/lon yet
                        // onLocationChange({ name: e.target.value, lat: null, lon: null }); 
                    }}
                    onFocus={() => query.length >= 3 && setShowSuggestions(true)}
                />
                <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={handleCurrentLocation}
                    title="Use Current Location"
                >
                    {isLoading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-crosshair"></i>}
                </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <ul className="list-group position-absolute w-100 z-3 shadow mt-1">
                    {suggestions.map((item) => (
                        <button
                            key={item.place_id}
                            type="button"
                            className="list-group-item list-group-item-action bg-dark text-light border-secondary text-start"
                            onClick={() => handleSelect(item)}
                        >
                            <small>{item.display_name}</small>
                        </button>
                    ))}
                </ul>
            )}

            {/* Debug/Info: Show verified coordinates if present */}
            {latitude && longitude && (
                <div className="form-text text-success">
                    <i className="bi bi-check-circle-fill me-1"></i>
                    Coordinates set: {Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}
                </div>
            )}
        </div>
    );
}
