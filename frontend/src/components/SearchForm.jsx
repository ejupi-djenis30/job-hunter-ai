import React, { useState } from "react";
import { SearchService } from "../services/search";
import { LocationInput } from "./LocationInput";

export function SearchForm({ onStartSearch, isLoading }) {
    const [profile, setProfile] = useState({
        name: "My Profile",
        role_description: "",
        search_strategy: "Focus on technical roles, ignore senior management positions.",
        location_filter: "Zurich",
        workload_filter: "80-100",
        posted_within_days: 30,
        max_distance: 50,
        latitude: 47.3769,
        longitude: 8.5417,
        cv_content: "",
        scrape_mode: "sequential",
        schedule_enabled: false,
        schedule_interval_hours: 24,
    });

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
            alert("Please upload your CV first. It is required for AI-powered search.");
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
                    <div className="card-body p-4 text-start">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-4">
                                {/* Left Column: Core Info */}
                                <div className="col-lg-6">
                                    <h6 className="text-secondary text-uppercase tracking-wider fw-bold mb-3 border-bottom border-secondary border-opacity-25 pb-2">
                                        Profile & Role
                                    </h6>

                                    {/* Role Description */}
                                    <div className="mb-4">
                                        <label className="form-label text-light small fw-bold mb-2">
                                            What are you looking for?
                                        </label>
                                        <textarea
                                            name="role_description"
                                            value={profile.role_description}
                                            onChange={handleChange}
                                            placeholder="e.g. Senior Python Backend Developer, seeking remote work..."
                                            className="form-control bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                                            rows="4"
                                            required
                                            style={{ backdropFilter: 'blur(5px)' }}
                                        />
                                    </div>

                                    {/* CV Upload (Required) */}
                                    <div className="mb-4">
                                        <label className="form-label text-light small fw-bold mb-2">
                                            <i className="bi bi-file-earmark-text me-1 text-primary"></i>Upload CV <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,.txt,.md"
                                            onChange={handleCVUpload}
                                            className="form-control bg-dark bg-opacity-50 text-light border-secondary border-opacity-25 mb-2"
                                        />
                                        {profile.cv_content ? (
                                            <div className="p-2 rounded bg-success bg-opacity-10 border border-success border-opacity-25">
                                                <small className="text-success d-flex align-items-center">
                                                    <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                                                    <span>CV loaded successfully. AI will use this to find matches.</span>
                                                </small>
                                            </div>
                                        ) : (
                                            <small className="text-warning d-block opacity-75">
                                                <i className="bi bi-info-circle me-1"></i>Required for AI analysis
                                            </small>
                                        )}
                                    </div>

                                    {/* AI Strategy */}
                                    <div className="mb-4">
                                        <label className="form-label text-light small fw-bold mb-2">
                                            <i className="bi bi-robot me-1 text-primary"></i>AI Instructions
                                        </label>
                                        <textarea
                                            name="search_strategy"
                                            value={profile.search_strategy}
                                            onChange={handleChange}
                                            placeholder="Instructions for the AI agent (e.g. 'Ignore internship roles')..."
                                            className="form-control bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                                            rows="3"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Filters & Config */}
                                <div className="col-lg-6">
                                    <h6 className="text-secondary text-uppercase tracking-wider fw-bold mb-3 border-bottom border-secondary border-opacity-25 pb-2">
                                        Search Parameters
                                    </h6>

                                    {/* Location */}
                                    <div className="mb-4">
                                        <LocationInput
                                            location={profile.location_filter}
                                            latitude={profile.latitude}
                                            longitude={profile.longitude}
                                            onLocationChange={handleLocationChange}
                                        />
                                    </div>

                                    <div className="row g-3 mb-4">
                                        {/* Workload */}
                                        <div className="col-md-6">
                                            <label className="form-label text-light small fw-bold mb-1">Workload</label>
                                            <select
                                                name="workload_filter"
                                                value={profile.workload_filter}
                                                onChange={handleChange}
                                                className="form-select bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                                            >
                                                <option value="80-100">80-100%</option>
                                                <option value="100">100%</option>
                                                <option value="50-100">50-100%</option>
                                                <option value="0-100">Any</option>
                                            </select>
                                        </div>

                                        {/* Scrape Mode */}
                                        <div className="col-md-6">
                                            <label className="form-label text-light small fw-bold mb-1">Scrape Speed</label>
                                            <select
                                                name="scrape_mode"
                                                value={profile.scrape_mode}
                                                onChange={handleChange}
                                                className="form-select bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                                            >
                                                <option value="sequential">Sequential (Safer)</option>
                                                <option value="immediate">Immediate (Faster)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Advanced Options Toggle */}
                                    <div className="mb-4">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary rounded-pill w-100 border-opacity-25 text-start d-flex justify-content-between align-items-center px-3"
                                            onClick={() => setShowAdvanced(!showAdvanced)}
                                        >
                                            <span><i className="bi bi-sliders me-2"></i>Advanced Filters</span>
                                            <i className={`bi bi-chevron-${showAdvanced ? 'up' : 'down'}`}></i>
                                        </button>

                                        {showAdvanced && (
                                            <div className="card bg-black bg-opacity-25 border-secondary border-opacity-25 mt-2 animate-fade-in">
                                                <div className="card-body p-3">
                                                    <div className="row g-3">
                                                        <div className="col-6">
                                                            <label className="form-label text-secondary small mb-1">Max Dist: <span className="text-light">{profile.max_distance} km</span></label>
                                                            <input type="range" name="max_distance" min="0" max="100" value={profile.max_distance} onChange={handleChange} className="form-range" />
                                                        </div>
                                                        <div className="col-6">
                                                            <label className="form-label text-secondary small mb-1">Age: <span className="text-light">{profile.posted_within_days} days</span></label>
                                                            <input type="range" name="posted_within_days" min="1" max="60" value={profile.posted_within_days} onChange={handleChange} className="form-range" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Schedule Toggle */}
                                    <div className="bg-black bg-opacity-20 rounded p-3 border border-secondary border-opacity-10">
                                        <div className="form-check form-switch d-flex align-items-center justify-content-between ps-0 mb-0">
                                            <label className="form-check-label text-light fw-medium cursor-pointer" htmlFor="scheduleSwitch">
                                                <i className="bi bi-clock-history me-2 text-primary"></i>Auto-Repeat Search
                                            </label>
                                            <input
                                                className="form-check-input ms-2"
                                                type="checkbox"
                                                id="scheduleSwitch"
                                                checked={profile.schedule_enabled}
                                                onChange={(e) => setProfile(prev => ({ ...prev, schedule_enabled: e.target.checked }))}
                                                style={{ width: '2.5em', height: '1.25em', cursor: 'pointer', float: 'none', marginLeft: 0 }}
                                            />
                                        </div>

                                        {profile.schedule_enabled && (
                                            <div className="mt-3 animate-fade-in border-top border-secondary border-opacity-10 pt-2">
                                                <div className="d-flex align-items-center">
                                                    <span className="text-secondary small me-2">Repeat every:</span>
                                                    <select
                                                        name="schedule_interval_hours"
                                                        value={profile.schedule_interval_hours}
                                                        onChange={handleChange}
                                                        className="form-select form-select-sm bg-dark bg-opacity-50 text-light border-secondary border-opacity-25 w-auto"
                                                    >
                                                        <option value="1">1 hour</option>
                                                        <option value="6">6 hours</option>
                                                        <option value="12">12 hours</option>
                                                        <option value="24">24 hours</option>
                                                        <option value="48">48 hours</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="mt-4 pt-3 border-top border-secondary border-opacity-25">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn btn-primary btn-lg w-100 text-white fw-bold py-3 rounded-pill shadow-lg hover-scale"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Initializing Agents...
                                        </>
                                    ) : (
                                        <><i className="bi bi-rocket-takeoff me-2"></i>Launch Intelligent Search</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
