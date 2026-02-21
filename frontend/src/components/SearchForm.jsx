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
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setProfile(prev => ({
                ...prev,
                ...prefill,
            }));
        }
    }, [prefill]);

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
            alert("⚠️ Invalid Location: Please select a valid location from the suggestions.");
            return;
        }

        onStartSearch(profile);
    };

    return (
        <div className="animate-fade-in w-100 h-100 d-flex flex-column">
            <div className="glass-panel p-3 p-lg-4 h-100 d-flex flex-column">
                <form onSubmit={handleSubmit} className="d-flex flex-column h-100">
                    
                    {/* Header */}
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-3 border-bottom border-white-10 gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center justify-content-center p-2 rounded-circle bg-primary-10 border border-primary-20 shadow-glow" style={{width: 42, height: 42}}>
                                <i className="bi bi-rocket-takeoff-fill text-primary fs-5"></i>
                            </div>
                            <div>
                                <h4 className="fw-bold mb-0 text-white leading-tight">New Search Consideration</h4>
                                <div className="text-secondary x-small">Configure AI parameters</div>
                            </div>
                        </div>
                        
                        <div className="d-flex align-items-center gap-2 align-self-stretch align-self-md-auto">
                             <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary rounded-pill px-4 shadow-glow hover-scale fw-bold d-flex align-items-center justify-content-center gap-2 w-100 w-md-auto"
                            >
                                {isLoading ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    <i className="bi bi-play-fill fs-5"></i>
                                )}
                                Start Search
                            </button>
                        </div>
                    </div>

                    {/* Main Grid content */}
                    <div className="row g-4 flex-grow-1">
                        
                        {/* Column 1: Core Inputs */}
                        <div className="col-lg-4 d-flex flex-column gap-4 border-end border-white-5">
                            <div>
                                <label className="form-label text-white small fw-bold text-uppercase x-small mb-2">Role Description <span className="text-danger">*</span></label>
                                <textarea
                                    name="role_description"
                                    value={profile.role_description}
                                    onChange={handleChange}
                                    placeholder="E.g. Senior Python Developer with AI experience..."
                                    className="form-control bg-black-20 border-white-10 text-white"
                                    style={{ height: '140px', resize: 'none' }}
                                    required
                                />
                            </div>

                             <div>
                                <label className="form-label text-white small fw-bold text-uppercase x-small mb-2">Target Location <span className="text-danger">*</span></label>
                                <LocationInput
                                    location={profile.location_filter}
                                    latitude={profile.latitude}
                                    longitude={profile.longitude}
                                    onLocationChange={handleLocationChange}
                                />
                            </div>
                             
                             <div className="p-3 rounded-3 border border-dashed border-secondary border-opacity-25 bg-black-20 hover-bg-white-5 transition-all mb-3 mb-lg-0">
                                <label className="d-flex align-items-center justify-content-between cursor-pointer mb-0 w-100">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className={`rounded-circle d-flex align-items-center justify-content-center ${profile.cv_content ? 'bg-success text-white' : 'bg-white-5 text-secondary'}`} style={{width: 36, height: 36}}>
                                            <i className={`bi ${profile.cv_content ? 'bi-check-lg' : 'bi-upload'}`}></i>
                                        </div>
                                        <div>
                                            <div className="fw-bold text-white small">{profile.cv_content ? 'CV Uploaded' : 'Upload CV'}</div>
                                            <div className="x-small text-secondary">{profile.cv_content ? 'Ready for analysis' : 'Required for AI'}</div>
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        className="d-none"
                                        accept=".pdf,.txt,.md"
                                        onChange={handleCVUpload}
                                    />
                                    <span className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 x-small text-uppercase">
                                        {profile.cv_content ? 'Change' : 'Select'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Column 2: Parameters */}
                        <div className="col-lg-4 d-flex flex-column gap-4 border-end border-white-5">
                             <div className="row g-3">
                                <div className="col-6">
                                    <label className="form-label text-white small fw-bold text-uppercase x-small mb-2">Workload</label>
                                    <select
                                        name="workload_filter"
                                        value={profile.workload_filter}
                                        onChange={handleChange}
                                        className="form-select form-select-sm bg-black-20 border-white-10 text-white"
                                    >
                                        <option value="80-100">80-100%</option>
                                        <option value="100">100% (Full time)</option>
                                        <option value="50-100">50-100%</option>
                                        <option value="0-100">Any</option>
                                    </select>
                                </div>
                                <div className="col-6">
                                    <label className="form-label text-white small fw-bold text-uppercase x-small mb-2">Posted</label>
                                    <select
                                        name="posted_within_days"
                                        value={profile.posted_within_days}
                                        onChange={handleChange}
                                        className="form-select form-select-sm bg-black-20 border-white-10 text-white"
                                    >
                                        <option value="1">Last 24h</option>
                                        <option value="3">Last 3 Days</option>
                                        <option value="7">Last Week</option>
                                        <option value="14">Last 2 Weeks</option>
                                        <option value="30">Last Month</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <div className="d-flex justify-content-between mb-2">
                                    <label className="form-label text-white small fw-bold text-uppercase x-small mb-0">Max Distance</label>
                                    <span className="x-small text-info fw-bold">{profile.max_distance} km</span>
                                </div>
                                <input 
                                    type="range" 
                                    name="max_distance" 
                                    min="5" 
                                    max="100" 
                                    step="5" 
                                    value={profile.max_distance} 
                                    onChange={handleChange} 
                                    className="form-range" 
                                />
                            </div>

                             <div>
                                <label className="form-label text-white small fw-bold text-uppercase x-small mb-2">Extra AI Instructions</label>
                                <textarea
                                    name="search_strategy"
                                    value={profile.search_strategy}
                                    onChange={handleChange}
                                    placeholder="E.g. 'Remote only', 'Avoid startups', 'Salary > 80k'..."
                                    className="form-control bg-black-20 border-white-10 text-white"
                                    rows="4"
                                />
                            </div>
                        </div>

                         {/* Column 3: Advanced & Logistics */}
                         <div className="col-lg-4 d-flex flex-column gap-4">
                            
                            <div className="p-3 bg-white-5 rounded-3 border border-white-5">
                                <div className="form-check form-switch d-flex align-items-center justify-content-between ps-0 mb-3">
                                    <div>
                                        <label className="form-check-label fw-bold text-white small mb-0" htmlFor="scheduleSwitch">Automatic Search</label>
                                        <div className="x-small text-secondary opacity-75">Run this search periodically</div>
                                    </div>
                                    <input
                                        className="form-check-input ms-2"
                                        type="checkbox"
                                        id="scheduleSwitch"
                                        checked={profile.schedule_enabled}
                                        onChange={(e) => setProfile(prev => ({ ...prev, schedule_enabled: e.target.checked }))}
                                        style={{cursor: 'pointer'}}
                                    />
                                </div>
                                
                                {profile.schedule_enabled && (
                                    <div className="d-flex align-items-center justify-content-between border-top border-white-10 pt-3 opacity-animation">
                                        <span className="x-small text-secondary fw-bold text-uppercase">Interval</span>
                                        <div className="btn-group btn-group-sm" role="group">
                                            {[6, 12, 24].map(h => (
                                                <button
                                                    key={h}
                                                    type="button"
                                                    onClick={() => setProfile(prev => ({ ...prev, schedule_interval_hours: h }))}
                                                    className={`btn ${profile.schedule_interval_hours == h ? 'btn-light text-dark fw-bold' : 'btn-outline-secondary'}`}
                                                >
                                                    {h}h
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                             <div className="row g-3">
                                <div className="col-6">
                                     <label className="form-label text-white small fw-bold text-uppercase x-small mb-2">Scrape Speed</label>
                                    <select
                                        name="scrape_mode"
                                        value={profile.scrape_mode}
                                        onChange={handleChange}
                                        className="form-select form-select-sm bg-black-20 border-white-10 text-white"
                                    >
                                        <option value="sequential">Sequential</option>
                                        <option value="immediate">Fast (Risky)</option>
                                    </select>
                                </div>
                                <div className="col-6">
                                     <label className="form-label text-white small fw-bold text-uppercase x-small mb-2">Max Queries</label>
                                    <input
                                        type="number"
                                        name="max_queries"
                                        value={profile.max_queries}
                                        onChange={handleChange}
                                        placeholder="No Limit"
                                        className="form-control form-control-sm bg-black-20 border-white-10 text-white"
                                    />
                                </div>
                            </div>

                            <div className="mt-auto p-3 rounded-3 bg-info bg-opacity-10 border border-info border-opacity-20">
                                <div className="d-flex gap-2">
                                    <i className="bi bi-info-circle-fill text-info mt-1"></i>
                                    <div>
                                        <div className="fw-bold text-white small">Pro Tip</div>
                                        <div className="x-small text-info opacity-90">
                                            The more specific your role description, the better the AI matching score will be.
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
