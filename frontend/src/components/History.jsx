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
        return (
            <div className="d-flex justify-content-center align-items-center h-100">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    if (!profiles.length) {
        return (
            <div className="glass-panel text-center py-5 animate-fade-in align-items-center d-flex flex-column justify-content-center h-100">
                <div className="mb-4">
                    <div className="rounded-circle bg-secondary bg-opacity-10 d-inline-flex align-items-center justify-content-center" style={{ width: 80, height: 80 }}>
                        <i className="bi bi-journal-x fs-1 text-secondary opacity-50"></i>
                    </div>
                </div>
                <h4 className="text-white fw-bold">No History</h4>
                <p className="text-secondary opacity-75">Your past searches will appear here.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in h-100 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="mb-1 text-white fw-bold tracking-tight">Recent Activity</h3>
                    <p className="text-secondary small mb-0 opacity-75">Manage your past search configurations</p>
                </div>
                <button 
                    onClick={loadProfiles} 
                    className="btn btn-icon btn-secondary rounded-circle shadow-sm"
                    title="Refresh List"
                >
                    <i className="bi bi-arrow-clockwise"></i>
                </button>
            </div>

            <div className="d-flex flex-column gap-3 overflow-auto custom-scrollbar pb-3">
                {profiles.map(p => (
                    <div key={p.id} className="glass-panel p-3 px-md-4 py-md-3 hover-bg-white-5 transition-colors group">
                        <div className="row align-items-center g-3">
                            {/* Icon & ID */}
                            <div className="col-auto">
                                <div className={`rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm border border-white-10 ${p.schedule_enabled ? 'bg-success' : 'bg-primary'}`} style={{ width: 42, height: 42 }}>
                                    <i className={`bi ${p.schedule_enabled ? 'bi-robot' : 'bi-search'} fs-5`}></i>
                                </div>
                            </div>

                            {/* Main Info */}
                            <div className="col">
                                <h6 className="mb-1 fw-bold text-white text-truncate">{p.role_description}</h6>
                                <div className="d-flex flex-wrap gap-3 small text-white-50">
                                    <span className="d-flex align-items-center" title="Location">
                                        <i className="bi bi-geo-alt me-1 text-primary"></i>
                                        {p.location_filter || "Any Location"}
                                    </span>
                                    <span className="d-flex align-items-center" title="Time range">
                                        <i className="bi bi-calendar me-1 text-primary"></i>
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
                                <div className="d-flex gap-2 justify-content-end opacity-75 group-hover-opacity-100 transition-opacity">
                                    <button
                                        className="btn btn-sm btn-primary px-3 rounded-pill fw-medium shadow-glow"
                                        onClick={() => onStartSearch && onStartSearch(p)}
                                        title="Rerun Search"
                                    >
                                        <i className="bi bi-play-fill me-1"></i> Run
                                    </button>

                                    <button
                                        className="btn btn-sm btn-icon btn-secondary rounded-circle ms-1"
                                        onClick={() => onEdit?.(p)}
                                        title="Edit Parameters"
                                    >
                                        <i className="bi bi-pencil"></i>
                                    </button>

                                    {!p.schedule_enabled && (
                                        <button
                                            className="btn btn-sm btn-icon btn-secondary rounded-circle"
                                            onClick={() => onSaveAsSchedule?.(p)}
                                            title="Add to Schedule"
                                        >
                                            <i className="bi bi-clock"></i>
                                        </button>
                                    )}

                                    <div className="vr bg-white opacity-25 mx-1"></div>

                                    <button
                                        className="btn btn-sm btn-icon btn-outline-danger border-0 rounded-circle text-danger hover-bg-danger hover-text-white transition-colors"
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
