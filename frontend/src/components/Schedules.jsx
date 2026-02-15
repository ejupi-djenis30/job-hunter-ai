import React, { useState, useEffect } from "react";
import { api } from "../api";

export function Schedules() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            const data = await api.getProfiles();
            setProfiles(data);
        } catch (e) {
            console.error("Failed to load profiles:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (profileId, currentEnabled, intervalHours) => {
        try {
            await api.toggleSchedule(profileId, !currentEnabled, intervalHours);
            loadProfiles();
        } catch (e) {
            alert("Failed to toggle schedule: " + e.message);
        }
    };

    const handleDelete = async (profileId) => {
        if (!confirm("Delete this profile and its schedule?")) return;
        try {
            await api.deleteProfile(profileId);
            loadProfiles();
        } catch (e) {
            alert("Failed to delete profile: " + e.message);
        }
    };

    const handleChangeInterval = async (profileId, newInterval) => {
        try {
            await api.toggleSchedule(profileId, true, parseInt(newInterval));
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

    if (!profiles.length) {
        return (
            <div className="card bg-dark border-secondary">
                <div className="card-body text-center py-5">
                    <p className="fs-5 text-secondary mb-1">No search profiles yet</p>
                    <p className="text-secondary small">Start a new search to create a profile</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 text-light"><i className="bi bi-clock-history me-2"></i>Scheduled Searches</h5>
                <button onClick={loadProfiles} className="btn btn-sm btn-outline-secondary">
                    <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                </button>
            </div>

            <div className="row g-3">
                {profiles.map(p => (
                    <div key={p.id} className="col-md-6 col-lg-4">
                        <div className={`card bg-dark border-${p.schedule_enabled ? 'success' : 'secondary'}`}>
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <h6 className="text-light mb-0">{p.name}</h6>
                                        <small className="text-secondary">#{p.id}</small>
                                    </div>
                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={p.schedule_enabled || false}
                                            onChange={() => handleToggle(p.id, p.schedule_enabled, p.schedule_interval_hours)}
                                        />
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <small className="text-secondary d-block">
                                        <i className="bi bi-geo-alt me-1"></i> {p.location_filter || "Any"}
                                    </small>
                                    <small className="text-secondary d-block" style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: "100%"
                                    }}>
                                        <i className="bi bi-crosshair me-1"></i> {p.role_description ? p.role_description.substring(0, 60) + (p.role_description.length > 60 ? '...' : '') : "No description"}
                                    </small>
                                </div>

                                {p.schedule_enabled && (
                                    <div className="mb-2">
                                        <select
                                            className="form-select form-select-sm bg-dark text-light border-secondary"
                                            value={p.schedule_interval_hours || 24}
                                            onChange={(e) => handleChangeInterval(p.id, e.target.value)}
                                        >
                                            <option value="1">Every 1h</option>
                                            <option value="3">Every 3h</option>
                                            <option value="6">Every 6h</option>
                                            <option value="12">Every 12h</option>
                                            <option value="24">Every 24h</option>
                                            <option value="48">Every 48h</option>
                                            <option value="72">Every 72h</option>
                                        </select>
                                    </div>
                                )}

                                <div className="d-flex justify-content-between align-items-center">
                                    <small className={p.schedule_enabled ? "text-success" : "text-secondary"}>
                                        {p.schedule_enabled ? <><i className="bi bi-circle-fill me-1"></i>Active</> : <><i className="bi bi-circle me-1"></i>Inactive</>}
                                    </small>
                                    {p.last_scheduled_run && (
                                        <small className="text-secondary">
                                            Last: {new Date(p.last_scheduled_run).toLocaleString()}
                                        </small>
                                    )}
                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleDelete(p.id)}
                                        title="Delete profile"
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
