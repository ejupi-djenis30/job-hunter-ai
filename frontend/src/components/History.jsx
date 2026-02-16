import React, { useState, useEffect } from "react";
import { SearchService } from "../services/search";

export function History({ onStartSearch, onEdit, onSaveAsSchedule }) {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            const data = await SearchService.getProfiles();
            // Sort by ID descending (newest first)
            setProfiles(data.sort((a, b) => b.id - a.id));
        } catch (e) {
            console.error("Failed to load profiles:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (profileId) => {
        if (!window.confirm("Delete this history entry?")) return;
        try {
            await SearchService.deleteProfile(profileId);
            loadProfiles();
        } catch (e) {
            alert("Failed to delete: " + e.message);
        }
    };

    if (loading) {
        return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
    }

    if (!profiles.length) {
        return (
            <div className="glass-card text-center py-5 animate-fade-in">
                <div className="card-body text-secondary">
                    <i className="bi bi-clock-history display-1 opacity-25 mb-3"></i>
                    <h5 className="fw-bold text-white">No Search History</h5>
                    <p className="small">Your past searches will appear here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid px-0 animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-1 text-white fw-bold">Recent Activity</h4>
                    <p className="text-secondary small mb-0">Manage your past search configurations</p>
                </div>
                <button onClick={loadProfiles} className="btn btn-sm btn-secondary rounded-circle" style={{ width: 32, height: 32 }}>
                    <i className="bi bi-arrow-clockwise"></i>
                </button>
            </div>

            <div className="d-flex flex-column gap-3">
                {profiles.map(p => (
                    <div key={p.id} className="glass-card p-3 p-md-4 hover-scale transition-all">
                        <div className="row align-items-center g-3">
                            {/* Icon & ID */}
                            <div className="col-auto">
                                <div className="rounded-circle bg-primary bg-gradient d-flex align-items-center justify-content-center text-white shadow-sm" style={{ width: 48, height: 48 }}>
                                    <i className="bi bi-search fs-5"></i>
                                </div>
                            </div>

                            {/* Main Info */}
                            <div className="col">
                                <h6 className="mb-1 fw-bold text-white text-truncate">{p.role_description}</h6>
                                <div className="d-flex flex-wrap gap-3 small text-secondary">
                                    <span className="d-flex align-items-center">
                                        <i className="bi bi-geo-alt me-1"></i>
                                        {p.location_filter || "Any Location"}
                                    </span>
                                    <span className="d-flex align-items-center">
                                        <i className="bi bi-calendar me-1"></i>
                                        Last {p.posted_within_days} days
                                    </span>
                                    {p.schedule_enabled && (
                                        <span className="text-success fw-medium d-flex align-items-center">
                                            <i className="bi bi-check-circle-fill me-1"></i>
                                            Auto-runs every {p.schedule_interval_hours}h
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="col-12 col-md-auto mt-3 mt-md-0">
                                <div className="d-flex gap-2 justify-content-end">
                                    <button
                                        className="btn btn-sm btn-primary px-3 rounded-pill fw-medium shadow-sm scale-on-hover"
                                        onClick={() => onStartSearch && onStartSearch(p)}
                                        title="Rerun Search"
                                    >
                                        <i className="bi bi-play-fill me-1"></i> Run
                                    </button>

                                    <button
                                        className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0"
                                        style={{ width: 36, height: 36 }}
                                        onClick={() => onEdit?.(p)}
                                        title="Edit Parameters"
                                    >
                                        <i className="bi bi-pencil"></i>
                                    </button>

                                    {!p.schedule_enabled && (
                                        <button
                                            className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0"
                                            style={{ width: 36, height: 36 }}
                                            onClick={() => onSaveAsSchedule?.(p)}
                                            title="Add to Schedule"
                                        >
                                            <i className="bi bi-clock"></i>
                                        </button>
                                    )}

                                    <button
                                        className="btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center p-0 border-opacity-50"
                                        style={{ width: 36, height: 36 }}
                                        onClick={() => handleDelete(p.id)}
                                        title="Delete"
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
