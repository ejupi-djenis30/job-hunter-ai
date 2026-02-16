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
            <div className="glass-card text-center py-5 animate-fade-in mt-4">
                <div className="mb-3">
                    <div className="rounded-circle bg-teal bg-opacity-10 d-inline-flex align-items-center justify-content-center" style={{ width: 80, height: 80 }}>
                        <i className="bi bi-calendar-x fs-1 text-teal opacity-50"></i>
                    </div>
                </div>
                <h5 className="text-light">No Active Schedules</h5>
                <p className="text-secondary small">Your automated daily searches will appear here.<br />You can enable scheduling when creating a new search.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in py-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 text-light fw-bold"><i className="bi bi-clock-history me-2 text-primary"></i>Scheduled Searches</h5>
                <button onClick={loadProfiles} className="btn btn-sm btn-outline-secondary border-opacity-25 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                    <i className="bi bi-arrow-clockwise"></i>
                </button>
            </div>

            <div className="row g-4">
                {activeSchedules.map(p => (
                    <div key={p.id} className="col-md-6 col-lg-4">
                        <div className={`glass-card h-100 border-primary border-opacity-50`}>
                            <div className="card-body d-flex flex-column">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="overflow-hidden me-2">
                                        <h6 className="text-light mb-0 text-truncate fw-bold">{p.name}</h6>
                                        <small className="text-secondary opacity-75">ID: {p.id}</small>
                                    </div>
                                    <div className="form-check form-switch shrink-0">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={p.schedule_enabled || false}
                                            onChange={() => handleToggle(p.id, p.schedule_enabled, p.schedule_interval_hours)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>

                                <div className="mb-3 flex-grow-1">
                                    <div className="d-flex align-items-center mb-2 text-secondary small">
                                        <i className="bi bi-geo-alt me-2 text-primary opacity-75"></i>
                                        <span className="text-truncate">{p.location_filter || "Any Location"}</span>
                                    </div>
                                    <div className="d-flex align-items-start mb-2 text-secondary small">
                                        <i className="bi bi-briefcase me-2 text-primary opacity-75 mt-1"></i>
                                        <span className="text-truncate-2">{p.role_description || "No description"}</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-top border-secondary border-opacity-25 mt-auto">
                                    <div className="mb-3">
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-dark bg-opacity-50 border-secondary border-opacity-25 text-secondary">Every</span>
                                            <select
                                                className="form-select bg-dark bg-opacity-50 text-light border-secondary border-opacity-25"
                                                value={p.schedule_interval_hours || 24}
                                                onChange={(e) => handleChangeInterval(p.id, e.target.value)}
                                            >
                                                <option value="1">1h</option>
                                                <option value="3">3h</option>
                                                <option value="6">6h</option>
                                                <option value="12">12h</option>
                                                <option value="24">24h</option>
                                                <option value="48">48h</option>
                                                <option value="72">72h</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-end">
                                        <div>
                                            <div className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25 mb-1">
                                                <i className="bi bi-lightning-fill me-1"></i>Active
                                            </div>
                                            {p.last_scheduled_run && (
                                                <div className="text-secondary small" style={{ fontSize: '0.75rem' }}>
                                                    Last run: {new Date(p.last_scheduled_run).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            className="btn btn-sm btn-outline-danger border-opacity-25 rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ width: 32, height: 32 }}
                                            onClick={() => handleDelete(p.id)}
                                            title="Delete profile"
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
