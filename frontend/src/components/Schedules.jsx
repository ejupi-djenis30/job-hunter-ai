import React, { useState, useEffect } from "react";
import { SearchService } from "../services/search";

export function Schedules() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            const data = await SearchService.getProfiles();
            setProfiles(data);
        } catch (e) {
            console.error("Failed to load profiles:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (profileId, currentEnabled, intervalHours) => {
        try {
            await SearchService.toggleSchedule(profileId, !currentEnabled, intervalHours);
            loadProfiles();
        } catch (e) {
            alert("Failed to toggle schedule: " + e.message);
        }
    };

    const handleDelete = async (profileId) => {
        if (!window.confirm("Delete this profile and its schedule?")) return;
        try {
            await SearchService.deleteProfile(profileId);
            loadProfiles();
        } catch (e) {
            alert("Failed to delete profile: " + e.message);
        }
    };

    const handleChangeInterval = async (profileId, newInterval) => {
        try {
            await SearchService.toggleSchedule(profileId, true, parseInt(newInterval));
            loadProfiles();
        } catch (e) {
            alert("Failed to update interval: " + e.message);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center h-100">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    const activeSchedules = profiles.filter(p => p.schedule_enabled);

    if (activeSchedules.length === 0) {
        return (
            <div className="glass-panel text-center py-5 animate-fade-in align-items-center d-flex flex-column justify-content-center h-100">
                <div className="mb-4">
                    <div className="rounded-circle bg-success-10 d-inline-flex align-items-center justify-content-center border border-success-20 shadow-glow" style={{ width: 80, height: 80 }}>
                        <i className="bi bi-clock-history fs-1 text-success"></i>
                    </div>
                </div>
                <h4 className="text-white fw-bold">No Active Schedules</h4>
                <p className="text-secondary opacity-75 max-w-sm">Enable "Automatic Search" when creating a new search to let the agent work for you.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in h-100 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="mb-1 text-white fw-bold tracking-tight">Active Schedules</h3>
                    <p className="text-secondary small mb-0 opacity-75">Automated hunting campaigns currently running</p>
                </div>
                <button 
                    onClick={loadProfiles} 
                    className="btn btn-icon btn-secondary rounded-circle shadow-sm"
                    title="Refresh List"
                >
                    <i className="bi bi-arrow-clockwise"></i>
                </button>
            </div>

            <div className="row g-4 overflow-auto pb-4 custom-scrollbar">
                {activeSchedules.map(p => (
                    <div key={p.id} className="col-12 col-md-6 col-xl-4">
                        <div className="glass-panel p-4 h-100 d-flex flex-column hover-y-2 transition-transform shadow-sm">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle bg-success bg-gradient d-flex align-items-center justify-content-center text-white shadow-glow border border-white-10" style={{ width: 48, height: 48 }}>
                                        <i className="bi bi-robot fs-4"></i>
                                    </div>
                                    <div>
                                        <h6 className="text-white mb-0 fw-bold">{p.name || `Campaign #${p.id}`}</h6>
                                        <div className="d-flex align-items-center gap-2 mt-1">
                                            <span className="badge bg-success-10 text-success border border-success-20 rounded-pill px-2 py-1" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
                                            <span className="text-secondary x-small font-monospace">ID: {p.id}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-white-10 my-3 opacity-50" />

                            <div className="flex-grow-1 mb-4">
                                <div className="d-flex flex-column gap-2">
                                    <div className="d-flex align-items-start text-white-50 small">
                                        <i className="bi bi-briefcase me-2 mt-1 text-primary"></i>
                                        <span className="text-white fw-medium text-truncate-2" title={p.role_description}>{p.role_description}</span>
                                    </div>
                                    <div className="d-flex align-items-center text-white-50 small">
                                        <i className="bi bi-geo-alt me-2 text-primary"></i>
                                        <span>{p.location_filter || "Any Location"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black-20 rounded-3 p-3 border border-white-5">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-arrow-repeat text-white"></i>
                                        <span className="text-white small fw-bold">Interval</span>
                                    </div>
                                    <div className="form-check form-switch m-0">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={p.schedule_enabled || false}
                                            onChange={() => handleToggle(p.id, p.schedule_enabled, p.schedule_interval_hours)}
                                            style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                                            title="Toggle Schedule"
                                        />
                                    </div>
                                </div>

                                <div className="d-flex gap-2">
                                    <select
                                        className="form-select form-select-sm bg-black-20 border-white-10 text-white shadow-none"
                                        value={p.schedule_interval_hours || 24}
                                        onChange={(e) => handleChangeInterval(p.id, e.target.value)}
                                    >
                                        <option value="1">Every 1h</option>
                                        <option value="3">Every 3h</option>
                                        <option value="6">Every 6h</option>
                                        <option value="12">Every 12h</option>
                                        <option value="24">Every 24h</option>
                                    </select>

                                    <button
                                        className="btn btn-sm btn-outline-danger border-white-10 text-danger hover-bg-danger hover-text-white rounded-3 px-3 transition-colors"
                                        onClick={() => handleDelete(p.id)}
                                        title="Delete Campaign"
                                    >
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
