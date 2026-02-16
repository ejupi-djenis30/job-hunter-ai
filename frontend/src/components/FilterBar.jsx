import React from "react";

export function FilterBar({ filters, onChange, onClear }) {
    const handleChange = (key, value) => {
        onChange({ ...filters, [key]: value });
    };

    return (
        <div className="glass-card mb-4 animate-fade-in p-2">
            <div className="card-body p-2">
                <div className="row g-2 align-items-center">
                    {/* Minimum Match Score */}
                    <div className="col-6 col-md-auto">
                        <div className="d-flex align-items-center bg-dark bg-opacity-25 rounded-pill px-2 border border-secondary border-opacity-10">
                            <label className="small text-secondary fw-bold mb-0 me-2 ps-2 text-nowrap">Min Score</label>
                            <select
                                className="form-select form-select-sm border-0 bg-transparent text-light py-1 shadow-none"
                                value={filters.min_score || ""}
                                onChange={(e) => handleChange("min_score", e.target.value ? Number(e.target.value) : "")}
                                style={{ width: 'auto', minWidth: '80px' }}
                            >
                                <option value="">Any</option>
                                <option value="50">50%+</option>
                                <option value="70">70%+</option>
                                <option value="85">85%+</option>
                                <option value="90">90%+</option>
                            </select>
                        </div>
                    </div>

                    {/* Max Distance */}
                    <div className="col-6 col-md-auto">
                        <div className="d-flex align-items-center bg-dark bg-opacity-25 rounded-pill px-2 border border-secondary border-opacity-10">
                            <label className="small text-secondary fw-bold mb-0 me-2 ps-2 text-nowrap">Dist</label>
                            <select
                                className="form-select form-select-sm border-0 bg-transparent text-light py-1 shadow-none"
                                value={filters.max_distance || ""}
                                onChange={(e) => handleChange("max_distance", e.target.value ? Number(e.target.value) : "")}
                                style={{ width: 'auto', minWidth: '90px' }}
                            >
                                <option value="">Any</option>
                                <option value="10">10 km</option>
                                <option value="25">25 km</option>
                                <option value="50">50 km</option>
                                <option value="100">100 km</option>
                            </select>
                        </div>
                    </div>

                    {/* Worth Applying */}
                    <div className="col-auto">
                        <div className={`d-flex align-items-center px-3 py-1 rounded-pill cursor-pointer border ${filters.worth_applying ? 'bg-primary bg-opacity-25 border-primary border-opacity-25' : 'bg-dark bg-opacity-25 border-secondary border-opacity-10'}`} onClick={() => handleChange("worth_applying", !filters.worth_applying)}>
                            <div className="form-check form-switch mb-0 min-h-0 d-flex align-items-center">
                                <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    checked={filters.worth_applying === true}
                                    readOnly
                                    style={{ cursor: 'pointer', marginTop: 0 }}
                                />
                                <label className={`form-check-label small fw-bold mb-0 cursor-pointer ${filters.worth_applying ? 'text-primary' : 'text-secondary'}`} style={{ fontSize: '0.85rem' }}>
                                    Top Picks
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Sort Order */}
                    <div className="col-12 col-md-auto ms-auto d-flex align-items-center gap-2">
                        <span className="text-secondary small fw-medium d-none d-md-inline">Sort by:</span>
                        <select
                            className="form-select form-select-sm bg-dark bg-opacity-25 text-light border-secondary border-opacity-10 rounded-pill ps-3"
                            value={`${filters.sort_by}:${filters.sort_order}`}
                            onChange={(e) => {
                                const [by, order] = e.target.value.split(":");
                                onChange({ ...filters, sort_by: by, sort_order: order });
                            }}
                            style={{ maxWidth: '160px' }}
                        >
                            <option value="created_at:desc">Newest First</option>
                            <option value="created_at:asc">Oldest First</option>
                            <option value="affinity_score:desc">Best Match</option>
                            <option value="distance_km:asc">Closest</option>
                            <option value="distance_km:desc">Furthest</option>
                        </select>

                        {/* Clear Button */}
                        <button
                            className="btn btn-sm btn-secondary rounded-circle d-flex align-items-center justify-content-center ms-1 p-0"
                            style={{ width: 32, height: 32, minWidth: 32 }}
                            onClick={onClear}
                            title="Clear filters"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
