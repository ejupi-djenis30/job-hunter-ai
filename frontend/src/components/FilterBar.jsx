import React from "react";

export function FilterBar({ filters, onChange, onClear }) {
    const handleChange = (key, value) => {
        onChange({ ...filters, [key]: value });
    };

    return (
        <div className="glass-card mb-4 animate-fade-in p-1">
            <div className="card-body py-2 px-3">
                <div className="row g-2 align-items-center">
                    {/* Minimum Match Score */}
                    <div className="col-6 col-md-auto">
                        <label className="form-label small text-secondary fw-bold mb-0 me-2">Min Score:</label>
                        <select
                            className="form-select form-select-sm d-inline-block w-auto bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                            value={filters.min_score || ""}
                            onChange={(e) => handleChange("min_score", e.target.value ? Number(e.target.value) : "")}
                        >
                            <option value="">Any</option>
                            <option value="50">50%+</option>
                            <option value="70">70%+</option>
                            <option value="85">85%+</option>
                            <option value="90">90%+</option>
                        </select>
                    </div>

                    {/* Max Distance */}
                    <div className="col-6 col-md-auto">
                        <label className="form-label small text-secondary fw-bold mb-0 me-2">Max Dist:</label>
                        <select
                            className="form-select form-select-sm d-inline-block w-auto bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                            value={filters.max_distance || ""}
                            onChange={(e) => handleChange("max_distance", e.target.value ? Number(e.target.value) : "")}
                        >
                            <option value="">Any</option>
                            <option value="10">10 km</option>
                            <option value="25">25 km</option>
                            <option value="50">50 km</option>
                            <option value="100">100 km</option>
                        </select>
                    </div>

                    {/* Worth Applying */}
                    <div className="col-auto">
                        <div className="form-check form-switch mb-0 d-flex align-items-center">
                            <input
                                className="form-check-input me-2"
                                type="checkbox"
                                id="checkWorth"
                                checked={filters.worth_applying === true}
                                onChange={(e) => handleChange("worth_applying", e.target.checked ? true : "")}
                                style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                            />
                            <label className="form-check-label small text-light fw-medium" htmlFor="checkWorth" style={{ cursor: 'pointer' }}>
                                Worth Applying
                            </label>
                        </div>
                    </div>

                    {/* Sort Order */}
                    <div className="col-12 col-md-auto ms-auto border-start border-secondary border-opacity-25 ps-md-3">
                        <select
                            className="form-select form-select-sm bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                            value={`${filters.sort_by}:${filters.sort_order}`}
                            onChange={(e) => {
                                const [by, order] = e.target.value.split(":");
                                onChange({ ...filters, sort_by: by, sort_order: order });
                            }}
                        >
                            <option value="created_at:desc">Newest First</option>
                            <option value="created_at:asc">Oldest First</option>
                            <option value="affinity_score:desc">Best Match</option>
                            <option value="distance_km:asc">Closest Distance</option>
                            <option value="distance_km:desc">Furthest Distance</option>
                        </select>
                    </div>

                    {/* Clear Button */}
                    <div className="col-auto">
                        <button
                            className="btn btn-sm btn-outline-secondary border-opacity-25 rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: 32, height: 32 }}
                            onClick={onClear}
                            title="Clear all filters"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
