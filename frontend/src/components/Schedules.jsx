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
            <div className="text-center py-5">
                <div className="spinner-border text-primary" />
            </div>
        );
    }

    const activeSchedules = profiles.filter(p => p.schedule_enabled);

    if (activeSchedules.length === 0) {
        return (
            <div className="glass-card text-center py-5 animate-fade-in align-items-center d-flex flex-column justify-content-center">
                <div className="mb-4">
                    <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center" style={{ width: 80, height: 80 }}>
                        <i className="bi bi-calendar-x fs-1 text-success opacity-50"></i>
                    </div>
                </div>
                <h5 className="text-white fw-bold">No Active Schedules</h5>
                <p className="text-secondary small">Activate auto-search when creating a new search.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in py-1">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-1 text-white fw-bold">Active Schedules</h4>
                    <p className="text-secondary small mb-0">Automated jobs hunting campaigns</p>
                </div>
                <button onClick={loadProfiles} className="btn btn-sm btn-secondary rounded-circle" style={{ width: 32, height: 32 }}>
                    <i className="bi bi-arrow-clockwise"></i>
                </button>
            </div>

            <div className="row g-4">
                {activeSchedules.map(p => (
                    <div key={p.id} className="col-12 col-md-6 col-xl-4">
                        <div className="glass-card p-4 h-100 d-flex flex-column hover-scale transition-all">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle bg-success bg-gradient d-flex align-items-center justify-content-center text-white shadow-sm" style={{ width: 42, height: 42 }}>
                                        <i className="bi bi-robot fs-5"></i>
                                    </div>
                                    <div>
                                        <h6 className="text-white mb-0 fw-bold">{p.name || `Search #${p.id}`}</h6>
                                        <div className="d-flex align-items-center gap-2 mt-1">
                                            <span className="badge bg-success rounded-pill px-2 border-0" style={{ fontSize: '0.65rem' }}>Active</span>
                                            <span className="text-secondary x-small">ID: {p.id}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-secondary border-opacity-10 my-3" />

                            <div className="flex-grow-1 mb-4">
                                <div className="d-flex flex-column gap-2 text-secondary small">
                                    <div className="d-flex align-items-center">
                                        <i className="bi bi-briefcase me-2 text-secondary"></i>
                                        <span className="text-truncate-2 text-white-50">{p.role_description}</span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <i className="bi bi-geo-alt me-2 text-secondary"></i>
                                        <span>{p.location_filter || "Any Location"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-dark bg-opacity-50 rounded-4 p-3 border border-secondary border-opacity-10">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-stopwatch text-white"></i>
                                        <span className="text-white small fw-bold">Run Interval:</span>
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

                                <div className="d-flex align-items-center justify-content-between gap-2">
                                    <select
                                        className="form-select form-select-sm bg-input border-secondary border-opacity-25 text-white shadow-none"
                                        value={p.schedule_interval_hours || 24}
                                        onChange={(e) => handleChangeInterval(p.id, e.target.value)}
                                        style={{ maxWidth: '140px' }}
                                    >
                                        <option value="1">Every 1h</option>
                                        <option value="3">Every 3h</option>
                                        <option value="6">Every 6h</option>
                                        <option value="12">Every 12h</option>
                                        <option value="24">Every 24h</option>
                                    </select>

                                    <button
                                        className="btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center p-0"
                                        style={{ width: 32, height: 32 }}
                                        onClick={() => handleDelete(p.id)}
                                        title="Delete Schedule"
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
