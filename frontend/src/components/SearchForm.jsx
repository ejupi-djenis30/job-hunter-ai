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
            alert("⚠️ Invalid Location: Please select a valid location from the dropdown suggestions.");
            return;
        }

        onStartSearch(profile);
    };

    return (
        <div className="row justify-content-center">
            <div className="col-12 col-xl-9 animate-fade-in">
                <div className="glass-card p-4 p-md-5">
                    <form onSubmit={handleSubmit}>
                        <div className="text-center mb-5">
                            <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle mb-3" style={{ width: 64, height: 64 }}>
                                <i className="bi bi-briefcase-fill text-white fs-3"></i>
                            </div>
                            <h3 className="fw-bold mb-1">Find Your Next Job</h3>
                            <p className="text-secondary">AI-powered search tailored to your CV and preferences</p>
                        </div>

                        <div className="row g-4 g-md-5">
                            {/* Left Column: Role & CV */}
                            <div className="col-md-6">
                                <h6 className="text-uppercase tracking-wider text-secondary fw-bold small mb-4">
                                    <i className="bi bi-person-badge-fill me-2 text-primary"></i>Profile & Role
                                </h6>

                                <div className="mb-4">
                                    <label className="form-label">Role Description <span className="text-danger">*</span></label>
                                    <textarea
                                        name="role_description"
                                        value={profile.role_description}
                                        onChange={handleChange}
                                        placeholder="e.g. Senior Python Backend Developer with focus on AI..."
                                        className="form-control"
                                        rows="3"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="form-label">Your CV <span className="text-danger">*</span></label>
                                    <div className={`p-3 rounded-4 border ${profile.cv_content ? 'border-success bg-success bg-opacity-10' : 'border-secondary border-opacity-25 bg-dark bg-opacity-25'}`}>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="overflow-hidden me-3">
                                                {profile.cv_content ? (
                                                    <div className="d-flex align-items-center text-success">
                                                        <i className="bi bi-file-earmark-check-fill fs-4 me-2"></i>
                                                        <span className="fw-medium text-truncate">CV Uploaded</span>
                                                    </div>
                                                ) : (
                                                    <div className="d-flex align-items-center text-secondary">
                                                        <i className="bi bi-file-earmark-arrow-up fs-4 me-2"></i>
                                                        <span className="small">Upload PDF/TXT</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <input
                                                    type="file"
                                                    id="cv-upload"
                                                    className="d-none"
                                                    accept=".pdf,.txt,.md"
                                                    onChange={handleCVUpload}
                                                />
                                                <label htmlFor="cv-upload" className="btn btn-sm btn-secondary rounded-pill">
                                                    {profile.cv_content ? 'Change' : 'Choose File'}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label">AI Instructions <span className="text-secondary opacity-50 fw-normal">(Optional)</span></label>
                                    <textarea
                                        name="search_strategy"
                                        value={profile.search_strategy}
                                        onChange={handleChange}
                                        placeholder="Extra context for the agent (e.g. 'Avoid startups', 'Remote only')..."
                                        className="form-control"
                                        rows="2"
                                    />
                                </div>
                            </div>

                            {/* Right Column: Location & Preferences */}
                            <div className="col-md-6">
                                <h6 className="text-uppercase tracking-wider text-secondary fw-bold small mb-4">
                                    <i className="bi bi-sliders me-2 text-primary"></i>Preferences
                                </h6>

                                <div className="mb-4">
                                    <LocationInput
                                        location={profile.location_filter}
                                        latitude={profile.latitude}
                                        longitude={profile.longitude}
                                        onLocationChange={handleLocationChange}
                                    />
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-6">
                                        <label className="form-label">Workload</label>
                                        <select
                                            name="workload_filter"
                                            value={profile.workload_filter}
                                            onChange={handleChange}
                                            className="form-select"
                                        >
                                            <option value="80-100">80-100%</option>
                                            <option value="100">100% (Full time)</option>
                                            <option value="50-100">50-100%</option>
                                            <option value="0-100">Any</option>
                                        </select>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label">Posted Within</label>
                                        <select
                                            name="posted_within_days"
                                            value={profile.posted_within_days}
                                            onChange={handleChange}
                                            className="form-select"
                                        >
                                            <option value="1">Last 24h</option>
                                            <option value="3">Last 3 Days</option>
                                            <option value="7">Last 7 Days</option>
                                            <option value="14">Last 2 Weeks</option>
                                            <option value="30">Last Month</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Schedule Toggle */}
                                <div className="p-3 rounded-4 bg-dark bg-opacity-25 border border-secondary border-opacity-10 mb-4">
                                    <div className="form-check form-switch d-flex align-items-center justify-content-between ps-0 mb-0">
                                        <div className="d-flex align-items-center">
                                            <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${profile.schedule_enabled ? 'bg-primary text-white' : 'bg-secondary bg-opacity-10 text-secondary'}`} style={{ width: 32, height: 32 }}>
                                                <i className="bi bi-clock-history"></i>
                                            </div>
                                            <div>
                                                <label className="form-check-label fw-bold cursor-pointer" htmlFor="scheduleSwitch">
                                                    Daily Auto-Search
                                                </label>
                                                <div className="small text-secondary">Run this search automatically</div>
                                            </div>
                                        </div>
                                        <input
                                            className="form-check-input ms-2"
                                            type="checkbox"
                                            id="scheduleSwitch"
                                            checked={profile.schedule_enabled}
                                            onChange={(e) => setProfile(prev => ({ ...prev, schedule_enabled: e.target.checked }))}
                                            style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                        />
                                    </div>

                                    {profile.schedule_enabled && (
                                        <div className="mt-3 pt-3 border-top border-secondary border-opacity-10 animate-fade-in d-flex align-items-center justify-content-between">
                                            <span className="text-secondary small fw-medium">Repeat every:</span>
                                            <div className="btn-group" role="group">
                                                {[6, 12, 24].map(h => (
                                                    <button
                                                        key={h}
                                                        type="button"
                                                        onClick={() => setProfile(prev => ({ ...prev, schedule_interval_hours: h }))}
                                                        className={`btn btn-sm ${profile.schedule_interval_hours == h ? 'btn-light' : 'btn-outline-secondary'}`}
                                                    >
                                                        {h}h
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Collapsible Advanced Section */}
                        <div className="border-top border-secondary border-opacity-10 pt-3 mb-4">
                            <button
                                type="button"
                                className="btn btn-link text-secondary text-decoration-none w-100 d-flex align-items-center justify-content-center small"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                            >
                                {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                                <i className={`bi bi-chevron-${showAdvanced ? 'up' : 'down'} ms-2`}></i>
                            </button>

                            {showAdvanced && (
                                <div className="row g-3 mt-1 animate-fade-in p-3 rounded-4 bg-dark bg-opacity-25">
                                    <div className="col-md-4">
                                        <label className="form-label small">Max Distance ({profile.max_distance}km)</label>
                                        <input type="range" name="max_distance" min="5" max="100" step="5" value={profile.max_distance} onChange={handleChange} className="form-range" />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small">Scrape Speed</label>
                                        <select
                                            name="scrape_mode"
                                            value={profile.scrape_mode}
                                            onChange={handleChange}
                                            className="form-select form-select-sm"
                                        >
                                            <option value="sequential">Sequential (Safe)</option>
                                            <option value="immediate">Fast (Riskier)</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small">Max Queries (Limit AI)</label>
                                        <input
                                            type="number"
                                            name="max_queries"
                                            value={profile.max_queries}
                                            onChange={handleChange}
                                            placeholder="Unlimited"
                                            className="form-control form-control-sm"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Action */}
                        <div className="text-center">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary btn-lg rounded-pill px-5 shadow-lg hover-scale"
                            >
                                {isLoading ? (
                                    <span><span className="spinner-border spinner-border-sm me-2"></span>Initiating...</span>
                                ) : (
                                    <span className="fw-bold fs-6">Launch Search Campaign <i className="bi bi-arrow-right ms-2"></i></span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
