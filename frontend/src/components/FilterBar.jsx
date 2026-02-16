import React from "react";

export function FilterBar({ filters, onChange, onClear }) {
    const handleChange = (key, value) => {
        onChange({ ...filters, [key]: value });
    };

    return (
        <div className="card bg-dark border-secondary mb-3">
            <div className="card-body py-2 px-3">
                <div className="row g-2 align-items-center">
                    {/* Minimum Match Score */}
                    <div className="col-auto">
                        <label className="form-label small text-muted mb-0 me-2">Min Score:</label>
                        <select
                            className="form-select form-select-sm d-inline-block w-auto bg-dark text-light border-secondary"
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
                    <div className="col-auto">
                        <label className="form-label small text-muted mb-0 me-2">Max Dist:</label>
                        <select
                            className="form-select form-select-sm d-inline-block w-auto bg-dark text-light border-secondary"
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
                        <div className="form-check form-switch mb-0">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="checkWorth"
                                checked={filters.worth_applying === true}
                                onChange={(e) => {
                                    // If checked, set to true. If unchecked, set to "" (undefined/null logic handled by parent)
                                    // But typically for a toggle we want 'true' or 'null' (any)
                                    handleChange("worth_applying", e.target.checked ? true : "");
                                }}
                            />
                            <label className="form-check-label small" htmlFor="checkWorth">
                                Worth Applying
                            </label>
                        </div>
                    </div>

                    {/* Sort Order */}
                    <div className="col-auto ms-auto">
                        <select
                            className="form-select form-select-sm bg-dark text-light border-secondary"
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
                            className="btn btn-sm btn-outline-secondary"
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
