import React from "react";

function ScoreBadge({ score }) {
    let colorClass = "badge-secondary";
    let icon = "bi-dash";
    
    if (score >= 85) {
        colorClass = "badge-success";
        icon = "bi-check-lg";
    } else if (score >= 70) {
        colorClass = "badge-warning";
        icon = "bi-exclamation";
    }

    return (
        <span className={`badge-pill ${colorClass} d-inline-flex align-items-center gap-1`}>
            <i className={`bi ${icon}`} style={{ fontSize: '0.9em' }}></i>
            {score}%
        </span>
    );
}

function DistanceBadge({ km }) {
    if (km == null) return <span className="text-secondary small opacity-50">—</span>;
    let colorClass = "text-secondary";
    if (km <= 15) colorClass = "text-success";
    else if (km <= 40) colorClass = "text-info";

    return (
        <span className={`small fw-medium ${colorClass} d-inline-flex align-items-center bg-black-20 px-2 py-1 rounded`}>
            <i className="bi bi-geo-alt me-1 opacity-75"></i>{km}km
        </span>
    );
}

// Mobile Card Component
function JobCard({ job, isGlobalView, onToggleApplied }) {
    const isJobRoomOnly = job.jobroom_url && (!job.url || job.url === job.jobroom_url);
    const applyUrl = isJobRoomOnly ? null : job.url;

    const handleCopy = (job) => {
        const text = JSON.stringify({
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            url: job.url || job.jobroom_url
        }, null, 2);
        
        navigator.clipboard.writeText(text).then(() => {
            // Optional: Show a toast? For now just log or rely on user knowing
            console.log("Copied to clipboard");
        });
    };

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
                    <button onClick={() => handleCopy(job)} className="btn btn-sm btn-secondary rounded-circle btn-icon" title="Copy Details">
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

export function JobTable({ jobs, isGlobalView, onToggleApplied, pagination, onPageChange }) {
    const handleCopy = (job) => {
        const text = JSON.stringify({
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            url: job.url || job.jobroom_url
        }, null, 2);
        navigator.clipboard.writeText(text);
    };
    if (!jobs || jobs.length === 0) {
        return (
            <div className="glass-panel text-center py-5 animate-fade-in align-items-center d-flex flex-column justify-content-center h-100">
                <div className="mb-4">
                    <div className="rounded-circle bg-secondary bg-opacity-10 d-inline-flex align-items-center justify-content-center" style={{ width: 80, height: 80 }}>
                        <i className="bi bi-search fs-1 text-secondary opacity-50"></i>
                    </div>
                </div>
                <h4 className="text-white fw-bold">No jobs found</h4>
                <p className="text-secondary max-w-sm">Try adjusting your filters or starting a new search to find opportunities.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in h-100 d-flex flex-column">
            {/* Mobile View (Cards) */}
            <div className="d-lg-none">
                {jobs.map(job => (
                    <JobCard key={job.id} job={job} isGlobalView={isGlobalView} onToggleApplied={onToggleApplied} />
                ))}
            </div>

            {/* Desktop View (Table) */}
            <div className="d-none d-lg-block flex-grow-1 overflow-auto custom-scrollbar">
                <table className="table table-hover align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead className="sticky-top bg-dark" style={{ zIndex: 10 }}>
                        <tr>
                            <th className="ps-4 py-3 bg-black-50 text-secondary text-uppercase x-small tracking-wider border-bottom border-white-10" style={{ width: "30%" }}>Job Title</th>
                            <th className="py-3 bg-black-50 text-secondary text-uppercase x-small tracking-wider border-bottom border-white-10" style={{ width: "20%" }}>Company & Location</th>
                            <th className="py-3 bg-black-50 text-secondary text-uppercase x-small tracking-wider border-bottom border-white-10" style={{ width: "20%" }}>{!isGlobalView ? 'Match & Details' : 'Details'}</th>
                            <th className="py-3 bg-black-50 text-secondary text-uppercase x-small tracking-wider border-bottom border-white-10" style={{ width: "8%" }}>Applied</th>
                            <th className="pe-4 py-3 bg-black-50 text-end text-secondary text-uppercase x-small tracking-wider border-bottom border-white-10" style={{ width: "12%" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map((job) => (
                            <tr key={job.id} className="job-row border-bottom border-white-5 hover-elevation" style={{ transition: 'all 0.2s' }}>
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
                                                    <button onClick={() => handleCopy(job)} className="btn btn-sm btn-secondary btn-icon" title="Copy Details">
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
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-3 border-top border-white-10 bg-black-20 rounded-bottom">
                <div className="d-flex justify-content-between align-items-center">
                    <div className="text-secondary x-small fw-medium">
                        Showing <span className="text-white">{(pagination.page - 1) * 20 + 1}-{Math.min(pagination.page * 20, pagination.total)}</span> of <span className="text-white">{pagination.total}</span>
                    </div>

                    {pagination.pages > 1 && (
                        <div className="d-flex align-items-center gap-2">
                            <button
                                className="btn btn-sm btn-secondary btn-icon"
                                disabled={pagination.page === 1}
                                onClick={() => onPageChange(pagination.page - 1)}
                                style={{ width: 32, height: 32 }}
                            >
                                <i className="bi bi-chevron-left"></i>
                            </button>

                            <span className="text-white small fw-bold px-2">
                                {pagination.page} <span className="text-secondary fw-normal">/ {pagination.pages}</span>
                            </span>

                            <button
                                className="btn btn-sm btn-secondary btn-icon"
                                disabled={pagination.page === pagination.pages}
                                onClick={() => onPageChange(pagination.page + 1)}
                                style={{ width: 32, height: 32 }}
                            >
                                <i className="bi bi-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
