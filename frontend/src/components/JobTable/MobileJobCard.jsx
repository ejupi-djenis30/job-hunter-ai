import React from "react";
import { ScoreBadge, DistanceBadge } from "./Badges";

export function MobileJobCard({ job, isGlobalView, onToggleApplied, onCopy }) {
    const isJobRoomOnly = job.jobroom_url && (!job.url || job.url === job.jobroom_url);
    const applyUrl = isJobRoomOnly ? null : job.url;

    return (
        <div className="glass-panel p-3 mb-3 position-relative hover-card">
            <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="pe-2">
                    <h6 className="fw-bold mb-1 text-white text-break">{job.title}</h6>
                    <div className="text-secondary x-small d-flex align-items-center flex-wrap gap-2 mt-1">
                        <span className="text-white-50"><i className="bi bi-building me-1"></i>{job.company}</span>
                    </div>
                </div>
                <div className="d-flex flex-column align-items-end gap-2">
                    {!isGlobalView && job.affinity_score != null && (
                        <ScoreBadge score={Math.round(job.affinity_score)} />
                    )}
                    <span className="badge-pill bg-white-10 text-secondary border border-white-10">
                         {new Date(job.created_at).toLocaleDateString()}
                    </span>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3 bg-black-20 p-2 rounded">
                <div className="d-flex align-items-center text-secondary x-small">
                    <i className="bi bi-geo-alt me-1 text-info"></i>
                    {job.location || "Remote"} 
                    {job.distance_km != null && <span className="text-white-50 ms-1">({job.distance_km}km)</span>}
                </div>
                
                {!isGlobalView && job.worth_applying && (
                    <span className="badge-pill badge-success">
                        <i className="bi bi-star-fill me-1"></i>Top Pick
                    </span>
                )}
                {job.workload && (
                    <span className="badge-pill badge-info">
                        {job.workload}%
                    </span>
                )}
            </div>

            <div className="d-flex justify-content-between align-items-center pt-3 border-top border-white-10">
                <div className="d-flex gap-2">
                    {applyUrl && (
                        <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary rounded-pill px-3 fw-medium" style={{ minHeight: '32px' }}>
                            Apply <i className="bi bi-box-arrow-up-right ms-1"></i>
                        </a>
                    )}
                    <button onClick={() => onCopy(job)} className="btn btn-sm btn-secondary rounded-circle btn-icon" title="Copy Details">
                        <i className="bi bi-clipboard"></i>
                    </button>
                    {job.application_email && (
                        <a href={`mailto:${job.application_email}`} className="btn btn-sm btn-secondary rounded-circle btn-icon" title="Email">
                            <i className="bi bi-envelope"></i>
                        </a>
                    )}
                    {(job.jobroom_url) && (
                        <a href={job.jobroom_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary rounded-circle btn-icon" title="View on Job Room">
                            <i className="bi bi-link-45deg fs-5"></i>
                        </a>
                    )}
                </div>

                <div className={`form-check form-switch d-flex align-items-center gap-2 px-3 py-1 rounded-pill border ${job.applied ? 'border-success border-opacity-25 bg-success bg-opacity-10' : 'border-secondary border-opacity-10 bg-white-5'}`}>
                    <label className={`form-check-label small fw-bold mb-0 ${job.applied ? 'text-success' : 'text-secondary'}`} style={{ cursor: 'pointer' }}>
                        {job.applied ? 'Applied' : 'Mark Applied'}
                    </label>
                    <input
                        className="form-check-input mt-0"
                        type="checkbox"
                        checked={job.applied}
                        onChange={() => onToggleApplied(job)}
                        style={{ cursor: 'pointer' }}
                    />
                </div>
            </div>
        </div>
    );
}
