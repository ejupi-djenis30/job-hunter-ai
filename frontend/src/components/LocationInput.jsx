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
            // Switzerland only (ch), but with full address details for streets
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&countrycodes=ch&addressdetails=1&limit=10`
            );
            const data = await response.json();

            // Format display names
            const formattedSuggestions = data.map((item) => {
                const address = item.address || {};
                // Construct a better display name: Street, City, Canton
                const parts = [];
                // Street & House Number
                let street = address.road || address.pedestrian || address.highway || "";
                if (street && address.house_number) {
                    street += ` ${address.house_number}`;
                }
                if (street) parts.push(street);

                // City / Town / Village
                if (address.city) parts.push(address.city);
                else if (address.town) parts.push(address.town);
                else if (address.village) parts.push(address.village);
                else if (address.municipality) parts.push(address.municipality);

                // Canton/State
                if (address.state) parts.push(address.state);

                // Fallback to display_name if parts are empty (rare)
                const formattedDisplayName = parts.length > 0 ? parts.join(", ") : item.display_name;

                return {
                    place_id: item.place_id, // Keep place_id for key
                    display_name: formattedDisplayName,
                    lat: item.lat,
                    lon: item.lon,
                    full_name: item.display_name // Keep original full name for reference if needed
                };
            });

            setSuggestions(formattedSuggestions);
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
            if (query !== location) { // User typed something new
                // Strict Mode: If user types, invalidate previous coordinates until they select a new one
                onLocationChange({
                    name: query,
                    lat: null,
                    lon: null
                });
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
            <label className="form-label text-secondary small text-uppercase tracking-wider fw-bold mb-2">
                <i className="bi bi-geo-alt me-1 text-primary"></i>Location
            </label>
            <div className="input-group">
                <span className="input-group-text bg-dark bg-opacity-50 border-secondary border-opacity-25 text-primary">
                    <i className="bi bi-search"></i>
                </span>
                <input
                    type="text"
                    className="form-control bg-dark bg-opacity-50 text-light border-secondary border-opacity-25 py-2"
                    placeholder="Search city or address..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 3 && setShowSuggestions(true)}
                    style={{ backdropFilter: 'blur(5px)' }}
                />
                <button
                    className="btn btn-outline-secondary border-opacity-25"
                    type="button"
                    onClick={handleCurrentLocation}
                    title="Use Current Location"
                >
                    {isLoading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-crosshair"></i>}
                </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="position-absolute w-100 z-3 mt-2">
                    <div className="glass-card overflow-hidden border-0 shadow-lg" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <ul className="list-group list-group-flush bg-transparent">
                            {suggestions.map((item) => (
                                <button
                                    key={item.place_id}
                                    type="button"
                                    className="list-group-item list-group-item-action bg-transparent text-light border-secondary border-opacity-10 px-3 py-2 text-start"
                                    onClick={() => handleSelect(item)}
                                >
                                    <div className="d-flex align-items-center">
                                        <i className="bi bi-geo-alt-fill text-primary me-2 opacity-75"></i>
                                        <small>{item.display_name}</small>
                                    </div>
                                </button>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Debug/Info: Show verified coordinates if present */}
            {latitude && longitude && (
                <div className="form-text text-success mt-2 d-flex align-items-center small">
                    <i className="bi bi-check-circle-fill me-1"></i>
                    <span>Coords set: {Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}</span>
                </div>
            )}
        </div>
    );
}
