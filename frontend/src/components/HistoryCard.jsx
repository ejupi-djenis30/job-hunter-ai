import React from 'react';

export function HistoryCard({ profile, onStartSearch, onEdit, onSaveAsSchedule, onDelete }) {
    return (
        <div className="glass-panel p-3 px-md-4 py-md-3 hover-bg-white-5 transition-colors group">
            <div className="row align-items-center g-3">
                {/* Icon & ID */}
                <div className="col-auto">
                    <div className={`rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm border border-white-10 ${profile.schedule_enabled ? 'bg-success' : 'bg-primary'}`} style={{ width: 42, height: 42 }}>
                        <i className={`bi ${profile.schedule_enabled ? 'bi-robot' : 'bi-search'} fs-5`}></i>
                    </div>
                </div>

                {/* Main Info */}
                <div className="col">
                    <h6 className="mb-1 fw-bold text-white text-truncate">{profile.role_description}</h6>
                    <div className="d-flex flex-wrap gap-3 small text-white-50">
                        <span className="d-flex align-items-center" title="Location">
                            <i className="bi bi-geo-alt me-1 text-primary"></i>
                            {profile.location_filter || "Any Location"}
                        </span>
                        <span className="d-flex align-items-center" title="Time range">
                            <i className="bi bi-calendar me-1 text-primary"></i>
                            Last {profile.posted_within_days} days
                        </span>
                        {profile.schedule_enabled && (
                            <span className="text-success fw-medium d-flex align-items-center">
                                <i className="bi bi-check-circle-fill me-1"></i>
                                Auto-runs every {profile.schedule_interval_hours}h
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="col-12 col-md-auto mt-3 mt-md-0">
                    <div className="d-flex gap-2 justify-content-end opacity-75 group-hover-opacity-100 transition-opacity">
                        <button
                            className="btn btn-sm btn-primary px-3 rounded-pill fw-medium shadow-glow"
                            onClick={() => onStartSearch?.(profile)}
                            title="Rerun Search"
                        >
                            <i className="bi bi-play-fill me-1"></i> Run
                        </button>

                        <button
                            className="btn btn-sm btn-icon btn-secondary rounded-circle ms-1"
                            onClick={() => onEdit?.(profile)}
                            title="Edit Parameters"
                        >
                            <i className="bi bi-pencil"></i>
                        </button>

                        {!profile.schedule_enabled && (
                            <button
                                className="btn btn-sm btn-icon btn-secondary rounded-circle"
                                onClick={() => onSaveAsSchedule?.(profile)}
                                title="Add to Schedule"
                            >
                                <i className="bi bi-clock"></i>
                            </button>
                        )}

                        <div className="vr bg-white opacity-25 mx-1"></div>

                        <button
                            className="btn btn-sm btn-icon btn-outline-danger border-0 rounded-circle text-danger hover-bg-danger hover-text-white transition-colors"
                            onClick={() => onDelete(profile.id)}
                            title="Delete"
                        >
                            <i className="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
