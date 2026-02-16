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
            <div className="col-lg-8 animate-fade-in">
                <div className="glass-card overflow-hidden">
                    <div className="card-header bg-transparent border-secondary border-opacity-25 py-3">
                        <h5 className="mb-0 text-light fw-bold"><i className="bi bi-search me-2 text-primary"></i>New Job Search</h5>
                    </div>
                    <div className="card-body p-4">
                        <form onSubmit={handleSubmit}>
                            {/* Role Description */}
                            <div className="mb-4">
                                <label className="form-label text-secondary small text-uppercase tracking-wider fw-bold mb-2">
                                    <i className="bi bi-person-workspace me-1 text-primary"></i>What are you looking for?
                                </label>
                                <textarea
                                    name="role_description"
                                    value={profile.role_description}
                                    onChange={handleChange}
                                    placeholder="e.g. Senior Python Backend Developer, seeking remote work..."
                                    className="form-control bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                                    rows="3"
                                    required
                                    style={{ backdropFilter: 'blur(5px)' }}
                                />
                            </div>

                            {/* CV Upload (Required) */}
                            <div className="mb-4">
                                <label className="form-label text-secondary small text-uppercase tracking-wider fw-bold mb-2">
                                    <i className="bi bi-file-earmark-text me-1 text-primary"></i>Upload CV <span className="text-danger">*</span>
                                </label>
                                <div className="input-group">
                                    <input
                                        type="file"
                                        accept=".pdf,.txt,.md"
                                        onChange={handleCVUpload}
                                        className="form-control bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                                    />
                                </div>
                                {profile.cv_content ? (
                                    <small className="text-success d-block mt-2"><i className="bi bi-check-lg me-1"></i>CV loaded — AI will use it for keyword generation</small>
                                ) : (
                                    <small className="text-warning d-block mt-2"><i className="bi bi-exclamation-triangle me-1"></i>Required: AI generates searches from your CV</small>
                                )}
                            </div>

                            <div className="row g-4 mb-4">
                                {/* Location with Autocomplete */}
                                <div className="col-md-6">
                                    <LocationInput
                                        location={profile.location_filter}
                                        latitude={profile.latitude}
                                        longitude={profile.longitude}
                                        onLocationChange={handleLocationChange}
                                    />
                                </div>

                                {/* Workload */}
                                <div className="col-md-6">
                                    <label className="form-label text-secondary small text-uppercase tracking-wider fw-bold mb-2">
                                        <i className="bi bi-briefcase me-1 text-primary"></i>Workload
                                    </label>
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
                                    <label className="form-label text-secondary small text-uppercase tracking-wider fw-bold mb-2">
                                        <i className="bi bi-lightning me-1 text-primary"></i>Scrape Speed
                                    </label>
                                    <select
                                        name="scrape_mode"
                                        value={profile.scrape_mode}
                                        onChange={handleChange}
                                        className="form-select bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                                    >
                                        <option value="sequential">Sequential (1 req/sec, safer)</option>
                                        <option value="immediate">Immediate (all at once, faster)</option>
                                    </select>
                                </div>
                            </div>

                            {/* AI Strategy */}
                            <div className="mb-4">
                                <label className="form-label text-secondary small text-uppercase tracking-wider fw-bold mb-2">
                                    <i className="bi bi-robot me-1 text-primary"></i>AI Strategy
                                </label>
                                <textarea
                                    name="search_strategy"
                                    value={profile.search_strategy}
                                    onChange={handleChange}
                                    placeholder="Instructions for the AI agent..."
                                    className="form-control bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                                    rows="2"
                                />
                            </div>

                            {/* Advanced Toggle */}
                            <div className="mb-4">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                >
                                    <i className="bi bi-sliders me-1"></i> Advanced Filters <i className={`bi bi-chevron-${showAdvanced ? 'up' : 'down'} ms-1`}></i>
                                </button>
                            </div>

                            {showAdvanced && (
                                <div className="card bg-black bg-opacity-25 border-secondary border-opacity-25 mb-4">
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small">
                                                    Max Distance: <strong className="text-light">{profile.max_distance} km</strong>
                                                </label>
                                                <input
                                                    type="range"
                                                    name="max_distance"
                                                    min="0"
                                                    max="100"
                                                    value={profile.max_distance}
                                                    onChange={handleChange}
                                                    className="form-range"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small">
                                                    Posted Within: <strong className="text-light">{profile.posted_within_days} days</strong>
                                                </label>
                                                <input
                                                    type="range"
                                                    name="posted_within_days"
                                                    min="1"
                                                    max="60"
                                                    value={profile.posted_within_days}
                                                    onChange={handleChange}
                                                    className="form-range"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small">Latitude</label>
                                                <input
                                                    type="number"
                                                    name="latitude"
                                                    step="0.0001"
                                                    value={profile.latitude}
                                                    onChange={handleChange}
                                                    className="form-control form-control-sm bg-dark bg-opacity-50 text-light border-secondary border-opacity-25 font-monospace"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small">Longitude</label>
                                                <input
                                                    type="number"
                                                    name="longitude"
                                                    step="0.0001"
                                                    value={profile.longitude}
                                                    onChange={handleChange}
                                                    className="form-control form-control-sm bg-dark bg-opacity-50 text-light border-secondary border-opacity-25 font-monospace"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Schedule */}
                            <div className="card bg-black bg-opacity-25 border-secondary border-opacity-25 mb-4">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <label className="form-label text-light mb-0 fw-bold"><i className="bi bi-clock-history me-2 text-primary"></i>Auto-Repeat Search</label>
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={profile.schedule_enabled}
                                                onChange={(e) => setProfile(prev => ({
                                                    ...prev,
                                                    schedule_enabled: e.target.checked
                                                }))}
                                                style={{ width: '2.5em', height: '1.25em', cursor: 'pointer' }}
                                            />
                                        </div>
                                    </div>
                                    {profile.schedule_enabled && (
                                        <div>
                                            <label className="form-label text-secondary small">Repeat every:</label>
                                            <select
                                                name="schedule_interval_hours"
                                                value={profile.schedule_interval_hours}
                                                onChange={handleChange}
                                                className="form-select form-select-sm bg-dark bg-opacity-50 text-light border-secondary border-opacity-25 w-auto d-inline-block ms-2"
                                            >
                                                <option value="1">Every 1 hour</option>
                                                <option value="3">Every 3 hours</option>
                                                <option value="6">Every 6 hours</option>
                                                <option value="12">Every 12 hours</option>
                                                <option value="24">Every 24 hours (daily)</option>
                                                <option value="48">Every 48 hours</option>
                                                <option value="72">Every 72 hours</option>
                                            </select>
                                            <small className="text-info d-block mt-2">
                                                <i className="bi bi-info-circle me-1"></i>This search will run automatically every {profile.schedule_interval_hours}h while the server is running.
                                            </small>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary btn-lg w-100 text-white fw-bold py-3 rounded-3 shadow-lg"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Launching AI Agents...
                                    </>
                                ) : (
                                    <><i className="bi bi-rocket-takeoff me-2"></i>Start Intelligent Search</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
