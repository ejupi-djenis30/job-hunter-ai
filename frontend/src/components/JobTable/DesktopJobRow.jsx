import React from "react";
import { ScoreBadge } from "./Badges";

export function DesktopJobRow({ job, isGlobalView, onToggleApplied, onCopy }) {
    return (
        <tr className="job-row border-bottom border-white-5 hover-elevation" style={{ transition: 'all 0.2s' }}>
            <td className="ps-4 py-4 border-0">
                <div className="fw-bold text-white text-truncate" style={{ maxWidth: 280 }} title={job.title}>
                    {job.title}
                </div>
                <div className="x-small text-secondary mt-1 d-flex gap-2">
                    <span title="Scraped on">
                        {new Date(job.created_at).toLocaleDateString()}
                    </span>
                    {job.publication_date && (
                        <span className="text-info opacity-75">
                            Pub: {new Date(job.publication_date).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </td>
            <td className="border-0">
                <div className="text-white fw-medium text-truncate" style={{ maxWidth: 200 }} title={job.company}>
                    {job.company}
                </div>
                <div className="text-secondary small d-flex align-items-center gap-2">
                    <i className="bi bi-geo-alt opacity-50"></i>
                    {job.location || "Remote"}
                    {job.distance_km != null && <span className="text-white-50 opacity-75">({job.distance_km}km)</span>}
                </div>
            </td>
            <td className="border-0">
                <div className="d-flex align-items-center gap-3">
                    {!isGlobalView ? (
                        job.affinity_score != null ? (
                            <ScoreBadge score={Math.round(job.affinity_score)} />
                        ) : <span className="text-muted opacity-25">—</span>
                    ) : null}
                    
                    <div className="d-flex flex-wrap gap-1">
                        {!isGlobalView && job.worth_applying && (
                            <span className="badge-pill badge-success border-0 py-1" style={{fontSize: '0.65rem'}}>
                                Top Pick
                            </span>
                        )}
                        {job.workload && job.workload < 100 && (
                            <span className="badge-pill badge-info border-0 py-1" style={{fontSize: '0.65rem'}}>
                                {job.workload}%
                            </span>
                        )}
                    </div>
                </div>
            </td>
            <td className="border-0">
                <div className="form-check form-switch ms-1">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={job.applied}
                        onChange={() => onToggleApplied(job)}
                        style={{ cursor: 'pointer' }}
                        title="Toggle Applied Status"
                    />
                </div>
            </td>
            <td className="pe-4 text-end border-0">
                <div className="d-flex justify-content-end gap-2 text-nowrap">
                    {(() => {
                        const isJobRoomOnly = job.jobroom_url && (!job.url || job.url === job.jobroom_url);
                        const applyUrl = isJobRoomOnly ? null : job.url;
                        return (
                            <>
                                {applyUrl && (
                                    <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary px-3 rounded-md shadow-sm">
                                        Apply
                                    </a>
                                )}
                                <button onClick={() => onCopy(job)} className="btn btn-sm btn-secondary btn-icon" title="Copy Details">
                                    <i className="bi bi-clipboard"></i>
                                </button>
                                {job.jobroom_url && (
                                    <a href={job.jobroom_url} target="_blank" rel="noopener noreferrer"
                                        className={`btn btn-sm btn-icon ${isJobRoomOnly ? 'btn-secondary text-info' : 'btn-secondary'}`}
                                        title="View on Job Room">
                                        <i className="bi bi-link-45deg fs-5"></i>
                                    </a>
                                )}
                            </>
                        );
                    })()}
                </div>
            </td>
        </tr>
    );
}
