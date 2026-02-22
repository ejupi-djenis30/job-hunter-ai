import React, { useState } from "react";
import { ScoreBadge } from "./Badges";

export function DesktopJobRow({ job, isGlobalView, onToggleApplied, onCopy }) {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <tr className="job-row border-bottom border-white-5 hover-elevation" style={{ transition: 'all 0.2s' }}>
            <td className="ps-4 py-4 border-0">
                <div className="fw-bold text-white text-truncate" style={{ maxWidth: 280 }} title={job.title}>
                    {job.title}
                </div>
                <div className="x-small text-secondary mt-1 d-flex gap-2">
                    <span title="Scraped on">
                        <i className="bi bi-clock x-small me-1"></i>
                        {new Date(job.created_at).toLocaleDateString()}
                    </span>
                    {job.publication_date && (
                        <span className="text-info opacity-75" title="Published on">
                            <i className="bi bi-megaphone x-small me-1"></i>
                            {new Date(job.publication_date).toLocaleDateString()}
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
                    
                    {job.application_email && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(job.application_email);
                            }}
                            className="btn btn-sm btn-icon btn-outline-secondary border-0 p-0 ms-1" 
                            style={{ width: '24px', height: '24px', minHeight: 'auto' }}
                            title={`Copy Email: ${job.application_email}`}
                        >
                            <i className="bi bi-envelope small text-info opacity-75"></i>
                        </button>
                    )}
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
                {job.affinity_analysis ? (
                    <div className="d-flex flex-column gap-1">
                        <button 
                            className="btn btn-sm btn-icon btn-secondary rounded-pill w-auto px-2 gap-1 border-0 bg-white-5 hover-bg-white-10"
                            onClick={() => setIsExpanded(!isExpanded)}
                            style={{ height: '24px', fontSize: '0.7rem' }}
                        >
                            <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                            {isExpanded ? 'Hide' : 'View'} Analysis
                        </button>
                        {isExpanded && (
                            <div className="x-small text-secondary mt-2 p-2 bg-black-50 rounded border border-white-5 animate-fade-in" 
                                 style={{ maxWidth: '300px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                {job.affinity_analysis}
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="text-muted opacity-25">N/A</span>
                )}
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
                        const applyUrl = job.application_url || job.external_url;
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
                                {job.external_url && (
                                    <a href={job.external_url} target="_blank" rel="noopener noreferrer"
                                        className="btn btn-sm btn-icon btn-secondary"
                                        title={`View on ${job.platform || 'Source'}`}>
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
