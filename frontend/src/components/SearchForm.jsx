import React, { useState, useEffect } from "react";
import { SearchService } from "../services/search";
import { LocationInput } from "./LocationInput";

export function SearchForm({ onStartSearch, isLoading, prefill }) {
    const [profile, setProfile] = useState({
        name: "My Profile",
        role_description: "",
        search_strategy: "",
        location_filter: "",
        workload_filter: "80-100",
        posted_within_days: 30,
        max_distance: 50,
        latitude: null,
        longitude: null,
        cv_content: "",
        scrape_mode: "sequential",
        schedule_enabled: false,
        schedule_interval_hours: 24,
        max_queries: "", // Empty means unlimited
    });

    useEffect(() => {
        if (prefill) {
            setProfile(prev => ({
                ...prev,
                ...prefill,
                // Ensure ID is passed if we want to update the same entry
                // but the user wants to EDIT, which implies creating a new history entry usually?
                // Actually, if they EDIT, they might want to just re-run with new params.
                // If it has an ID, App.jsx handleStartSearch will use it.
            }));
        }
    }, [prefill]);

    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleLocationChange = (locationData) => {
        setProfile(prev => ({
            ...prev,
            location_filter: locationData.name,
            latitude: locationData.lat,
            longitude: locationData.lon
        }));
    };

    const handleCVUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const { text } = await SearchService.uploadCV(file);
            setProfile(prev => ({ ...prev, cv_content: text }));
        } catch (err) {
            alert("Failed to upload CV: " + err.message);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Strict Validation
        if (!profile.cv_content) {
            alert("⚠️ Please upload your CV first. It is required for AI-powered search.");
            return;
        }
        if (!profile.role_description.trim()) {
            alert("⚠️ Please describe what you are looking for (Role Description).");
            return;
        }
        if (!profile.location_filter.trim()) {
            alert("⚠️ Please enter a location.");
            return;
        }
        if (!profile.latitude || !profile.longitude) {
            alert("⚠️ Invalid Location: Please select a valid location from the dropdown suggestions to ensure we have exact coordinates.");
            return;
        }

        onStartSearch(profile);
    };

    return (
        <div className="row justify-content-center">
            {/* Wider Container for 2-column layout */}
            <div className="col-12 col-xl-10 animate-fade-in">
                <div className="glass-card overflow-hidden">
                    <div className="card-header bg-transparent border-secondary border-opacity-25 py-3">
                        <h5 className="mb-0 text-light fw-bold"><i className="bi bi-search me-2 text-primary"></i>New Job Search</h5>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="card-body p-4 text-start">
                            <div className="row g-3">
                                {/* Col 1: Role & Strategy */}
                                <div className="col-lg-4 border-end border-secondary border-opacity-10">
                                    <h6 className="text-secondary text-uppercase tracking-wider fw-bold mb-3 small">
                                        1. Define Role
                                    </h6>

                                    <div className="mb-3">
                                        <label className="form-label text-light small fw-bold mb-1">Role Description <span className="text-danger">*</span></label>
                                        <textarea
                                            name="role_description"
                                            value={profile.role_description}
                                            onChange={handleChange}
                                            placeholder="e.g. Python Backend Developer..."
                                            className="form-control form-control-sm bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                                            rows="3"
                                            required
                                        />
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label text-light small fw-bold mb-1">AI Instructions</label>
                                        <textarea
                                            name="search_strategy"
                                            value={profile.search_strategy}
                                            onChange={handleChange}
                                            placeholder="Extra context for the agent..."
                                            className="form-control form-control-sm bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                                            rows="2"
                                        />
                                    </div>
                                </div>

                                {/* Col 2: Targeting */}
                                <div className="col-lg-4 border-end border-secondary border-opacity-10">
                                    <h6 className="text-secondary text-uppercase tracking-wider fw-bold mb-3 small">
                                        2. Targeting
                                    </h6>

                                    <div className="mb-3">
                                        <LocationInput
                                            location={profile.location_filter}
                                            latitude={profile.latitude}
                                            longitude={profile.longitude}
                                            onLocationChange={handleLocationChange}
                                        />
                                    </div>

                                    <div className="row g-2">
                                        <div className="col-6">
                                            <label className="form-label text-light small fw-bold mb-1">Workload</label>
                                            <select
                                                name="workload_filter"
                                                value={profile.workload_filter}
                                                onChange={handleChange}
                                                className="form-select form-select-sm bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                                            >
                                                <option value="80-100">80-100%</option>
                                                <option value="100">100%</option>
                                                <option value="50-100">50-100%</option>
                                                <option value="0-100">Any</option>
                                            </select>
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label text-light small fw-bold mb-1">Speed</label>
                                            <select
                                                name="scrape_mode"
                                                value={profile.scrape_mode}
                                                onChange={handleChange}
                                                className="form-select form-select-sm bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                                            >
                                                <option value="sequential">Sequential</option>
                                                <option value="immediate">Fast (Riskier)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Col 3: Assets & Config */}
                                <div className="col-lg-4">
                                    <h6 className="text-secondary text-uppercase tracking-wider fw-bold mb-3 small">
                                        3. Assets & Config
                                    </h6>

                                    <div className="mb-3">
                                        <label className="form-label text-light small fw-bold mb-1">
                                            Upload CV <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,.txt,.md"
                                            onChange={handleCVUpload}
                                            className="form-control form-control-sm bg-dark bg-opacity-50 text-light border-secondary border-opacity-25 mb-1"
                                        />
                                        {profile.cv_content ? (
                                            <small className="text-success fw-bold"><i className="bi bi-check-circle-fill me-1"></i>CV Uploaded</small>
                                        ) : (
                                            <small className="text-warning"><i className="bi bi-exclamation-circle me-1"></i>Required</small>
                                        )}
                                    </div>

                                    {/* Auto-Repeat - Styled Teal */}
                                    <div className={`p-2 rounded mb-0 border ${profile.schedule_enabled ? 'border-teal bg-teal bg-opacity-10' : 'border-secondary border-opacity-25 bg-white bg-opacity-5'}`}>
                                        <div className="form-check form-switch d-flex align-items-center justify-content-between ps-0 mb-0">
                                            <label className={`form-check-label small fw-bold cursor-pointer ${profile.schedule_enabled ? 'text-teal' : 'text-secondary'}`} htmlFor="scheduleSwitch">
                                                Run Daily
                                            </label>
                                            <input
                                                className="form-check-input ms-2"
                                                type="checkbox"
                                                id="scheduleSwitch"
                                                checked={profile.schedule_enabled}
                                                onChange={(e) => setProfile(prev => ({ ...prev, schedule_enabled: e.target.checked }))}
                                                style={{
                                                    cursor: 'pointer',
                                                    float: 'none',
                                                    marginLeft: 0,
                                                    backgroundColor: profile.schedule_enabled ? '#20c997' : '#343a40',
                                                    borderColor: profile.schedule_enabled ? '#20c997' : '#6c757d'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {profile.schedule_enabled && (
                                        <div className="mt-2 d-flex align-items-center animate-fade-in">
                                            <span className="text-secondary small me-2">Every:</span>
                                            <select
                                                name="schedule_interval_hours"
                                                value={profile.schedule_interval_hours}
                                                onChange={handleChange}
                                                className="form-select form-select-xs py-0 bg-transparent text-light border-0 w-auto fw-bold"
                                            >
                                                <option value="1">1h</option>
                                                <option value="6">6h</option>
                                                <option value="12">12h</option>
                                                <option value="24">24h</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-2 px-3">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-link text-secondary text-decoration-none p-0"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                    >
                                        <i className={`bi bi-chevron-${showAdvanced ? 'up' : 'down'} me-1`}></i>
                                        {showAdvanced ? 'Hide Advanced' : 'Show Advanced Filters'}
                                    </button>
                                    {showAdvanced && (
                                        <div className="row g-2 mt-1 animate-fade-in">
                                            <div className="col-4">
                                                <label className="text-secondary small">Max Dist: {profile.max_distance}km</label>
                                                <input type="range" name="max_distance" min="0" max="100" value={profile.max_distance} onChange={handleChange} className="form-range" />
                                            </div>
                                            <div className="col-4">
                                                <label className="text-secondary small">Age: {profile.posted_within_days}d</label>
                                                <input type="range" name="posted_within_days" min="1" max="60" value={profile.posted_within_days} onChange={handleChange} className="form-range" />
                                            </div>
                                            <div className="col-4">
                                                <label className="text-secondary small d-block mb-1">Max AI Queries</label>
                                                <input
                                                    type="number"
                                                    name="max_queries"
                                                    value={profile.max_queries}
                                                    onChange={handleChange}
                                                    placeholder="Unlimited"
                                                    className="form-control form-control-sm bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                                                    min="1"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button - Compact */}
                        <div className="px-4 pb-4 pt-2 text-end border-top border-secondary border-opacity-25">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary px-5 rounded-pill fw-bold shadow-lg hover-scale"
                            >
                                {isLoading ? (
                                    <span><span className="spinner-border spinner-border-sm me-2"></span>Running...</span>
                                ) : (
                                    <span>Launch Search <i className="bi bi-rocket-takeoff ms-2"></i></span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
