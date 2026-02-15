import React, { useState } from "react";

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

    const handleCVUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const { api } = await import("../api");
            const { text } = await api.uploadCV(file);
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
            <div className="col-lg-8">
                <div className="card bg-dark border-secondary">
                    <div className="card-header border-secondary">
                        <h5 className="mb-0 text-light">🔍 New Search</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            {/* Role Description */}
                            <div className="mb-3">
                                <label className="form-label text-light">What are you looking for?</label>
                                <textarea
                                    name="role_description"
                                    value={profile.role_description}
                                    onChange={handleChange}
                                    placeholder="e.g. Senior Python Backend Developer, seeking remote work..."
                                    className="form-control bg-dark text-light border-secondary"
                                    rows="4"
                                    required
                                />
                            </div>

                            {/* CV Upload (Required) */}
                            <div className="mb-3">
                                <label className="form-label text-light">Upload CV <span className="text-danger">*</span></label>
                                <input
                                    type="file"
                                    accept=".pdf,.txt,.md"
                                    onChange={handleCVUpload}
                                    className="form-control form-control-sm bg-dark text-light border-secondary"
                                />
                                {profile.cv_content ? (
                                    <small className="text-success">✓ CV loaded — AI will use it for keyword generation</small>
                                ) : (
                                    <small className="text-warning">⚠ Required: AI generates searches from your CV</small>
                                )}
                            </div>

                            <div className="row g-3 mb-3">
                                {/* Location */}
                                <div className="col-md-6">
                                    <label className="form-label text-light">📍 Location</label>
                                    <input
                                        type="text"
                                        name="location_filter"
                                        value={profile.location_filter}
                                        onChange={handleChange}
                                        placeholder="e.g. Zurich"
                                        className="form-control bg-dark text-light border-secondary"
                                    />
                                </div>

                                {/* Workload */}
                                <div className="col-md-6">
                                    <label className="form-label text-light">💼 Workload</label>
                                    <select
                                        name="workload_filter"
                                        value={profile.workload_filter}
                                        onChange={handleChange}
                                        className="form-select bg-dark text-light border-secondary"
                                    >
                                        <option value="80-100">80-100%</option>
                                        <option value="100">100%</option>
                                        <option value="50-100">50-100%</option>
                                        <option value="0-100">Any</option>
                                    </select>
                                </div>

                                {/* Scrape Mode */}
                                <div className="col-md-6">
                                    <label className="form-label text-light">⚡ Scrape Speed</label>
                                    <select
                                        name="scrape_mode"
                                        value={profile.scrape_mode}
                                        onChange={handleChange}
                                        className="form-select bg-dark text-light border-secondary"
                                    >
                                        <option value="sequential">Sequential (1 req/sec, safer)</option>
                                        <option value="immediate">Immediate (all at once, faster)</option>
                                    </select>
                                </div>
                            </div>

                            {/* AI Strategy */}
                            <div className="mb-3">
                                <label className="form-label text-light">🤖 AI Strategy</label>
                                <textarea
                                    name="search_strategy"
                                    value={profile.search_strategy}
                                    onChange={handleChange}
                                    placeholder="Instructions for the AI agent..."
                                    className="form-control bg-dark text-light border-secondary"
                                    rows="2"
                                />
                            </div>

                            {/* Advanced Toggle */}
                            <div className="mb-3">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                >
                                    ⚙️ Advanced Filters {showAdvanced ? '▲' : '▼'}
                                </button>
                            </div>

                            {showAdvanced && (
                                <div className="card bg-black bg-opacity-25 border-secondary mb-3">
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary">
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
                                                <label className="form-label text-secondary">
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
                                                <label className="form-label text-secondary">Latitude</label>
                                                <input
                                                    type="number"
                                                    name="latitude"
                                                    step="0.0001"
                                                    value={profile.latitude}
                                                    onChange={handleChange}
                                                    className="form-control form-control-sm bg-dark text-light border-secondary font-monospace"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary">Longitude</label>
                                                <input
                                                    type="number"
                                                    name="longitude"
                                                    step="0.0001"
                                                    value={profile.longitude}
                                                    onChange={handleChange}
                                                    className="form-control form-control-sm bg-dark text-light border-secondary font-monospace"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Schedule */}
                            <div className="card bg-black bg-opacity-25 border-secondary mb-3">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <label className="form-label text-light mb-0">⏰ Auto-Repeat Search</label>
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={profile.schedule_enabled}
                                                onChange={(e) => setProfile(prev => ({
                                                    ...prev,
                                                    schedule_enabled: e.target.checked
                                                }))}
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
                                                className="form-select form-select-sm bg-dark text-light border-secondary"
                                            >
                                                <option value="1">Every 1 hour</option>
                                                <option value="3">Every 3 hours</option>
                                                <option value="6">Every 6 hours</option>
                                                <option value="12">Every 12 hours</option>
                                                <option value="24">Every 24 hours (daily)</option>
                                                <option value="48">Every 48 hours</option>
                                                <option value="72">Every 72 hours</option>
                                            </select>
                                            <small className="text-info d-block mt-1">
                                                🔄 This search will run automatically every {profile.schedule_interval_hours}h while the server is running.
                                            </small>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-search btn-lg w-100 text-white fw-semibold"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Launching AI Agents...
                                    </>
                                ) : (
                                    '▶ Start Intelligent Search'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
