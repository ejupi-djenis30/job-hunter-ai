import React from "react";

function ScoreBadge({ score }) {
    let cls = "badge rounded-pill fw-normal ";
    if (score >= 85) cls += "bg-success";  // Global CSS handles the rest
    else if (score >= 70) cls += "bg-warning text-dark";
    else cls += "bg-secondary";

    return (
        <span className={cls} style={{ minWidth: '3.5em' }}>
            {score}%
        </span>
    );
}

function DistanceBadge({ km }) {
    if (km == null) return <span className="text-secondary small opacity-50">—</span>;
    let color = "text-secondary";
    if (km <= 15) color = "text-success";
    else if (km <= 40) color = "text-info";

    return <span className={`small fw-medium ${color}`}><i className="bi bi-geo mx-1 opacity-50"></i>{km}km</span>;
}

// Mobile Card Component
function JobCard({ job, onToggleApplied }) {
    // Determine if it's a "Job Room only" link situation
    const isJobRoomOnly = job.jobroom_url && (!job.url || job.url === job.jobroom_url);
    const applyUrl = isJobRoomOnly ? null : job.url;

    return (
        <div className="glass-card p-4 mb-3 position-relative hover-scale transition-all">
            <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="pe-3">
                    <h5 className="fw-bold mb-1 text-white">{job.title}</h5>
                    <div className="text-secondary small d-flex align-items-center flex-wrap gap-2">
                        <span className="text-white-50"><i className="bi bi-building me-1"></i>{job.company}</span>
                        <span className="text-secondary">•</span>
                        <span className="text-white-50"><i className="bi bi-geo-alt me-1"></i>{job.location || "Remote"}</span>
                    </div>
                </div>
                {job.affinity_score != null && (
                    <ScoreBadge score={Math.round(job.affinity_score)} />
                )}
            </div>

            <div className="d-flex flex-wrap gap-2 mb-4">
                <div className="px-2 py-1 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25 d-inline-flex align-items-center">
                    <DistanceBadge km={job.distance_km} />
                </div>
                {job.worth_applying && (
                    <span className="badge bg-success rounded-pill">
                        <i className="bi bi-star-fill me-1"></i>Top Pick
                    </span>
                )}
                {job.workload && (
                    <span className="badge bg-secondary rounded-pill fw-normal">
                        {job.workload}%
                    </span>
                )}
                <span className="badge bg-dark border border-secondary border-opacity-25 rounded-pill fw-normal text-secondary">
                    {new Date(job.created_at).toLocaleDateString()}
                </span>
            </div>

            <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex gap-2">
                    {applyUrl && (
                        <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary rounded-pill px-3 fw-bold">
                            Apply <i className="bi bi-box-arrow-up-right ms-1"></i>
                        </a>
                    )}
                    {job.application_email && (
                        <a href={`mailto:${job.application_email}`} className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }} title="Email">
                            <i className="bi bi-envelope"></i>
                        </a>
                    )}
                    {(job.jobroom_url) && (
                        <a href={job.jobroom_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }} title="View on Job Room">
                            <i className="bi bi-link-45deg fs-6"></i>
                        </a>
                    )}
                </div>

                <div className={`form-check form-switch d-flex align-items-center gap-2 px-3 py-1 rounded-pill border ${job.applied ? 'border-success border-opacity-50 bg-success bg-opacity-10' : 'border-secondary border-opacity-25 bg-dark bg-opacity-50'}`}>
                    <label className={`form-check-label small fw-bold mb-0 ${job.applied ? 'text-success' : 'text-secondary'}`} style={{ cursor: 'pointer' }}>
                        {job.applied ? 'Applied' : 'Mark Applied'}
                    </label>
                    <input
                        className="form-check-input mt-0"
                        type="checkbox"
                        checked={job.applied}
                        onChange={() => onToggleApplied(job)}
                        style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                    />
                </div>
            </div>
        </div>
    );
}

export function JobTable({ jobs, onToggleApplied, pagination, onPageChange }) {
    if (!jobs || jobs.length === 0) {
        return (
            <div className="glass-card text-center py-5 animate-fade-in align-items-center d-flex flex-column justify-content-center">
                <div className="mb-4">
                    <div className="rounded-circle bg-secondary bg-opacity-25 d-inline-flex align-items-center justify-content-center" style={{ width: 80, height: 80 }}>
                        <i className="bi bi-search fs-1 text-secondary"></i>
                    </div>
                </div>
                <h4 className="text-white fw-bold">No jobs found</h4>
                <p className="text-secondary">Try adjusting your filters or starting a new search.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Mobile View (Cards) */}
            <div className="d-lg-none">
                {jobs.map(job => (
                    <JobCard key={job.id} job={job} onToggleApplied={onToggleApplied} />
                ))}
            </div>

            {/* Desktop View (Table) */}
            <div className="d-none d-lg-block glass-card overflow-hidden d-flex flex-column">
                <div className="table-responsive flex-grow-1">
                    <table className="table table-hover align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0' }}>
                        <thead className="bg-dark bg-opacity-50 border-bottom border-secondary border-opacity-25">
                            <tr>
                                <th className="ps-4 py-3 text-secondary text-uppercase x-small tracking-wider border-0" style={{ width: "25%" }}>Job Title</th>
                                <th className="py-3 text-secondary text-uppercase x-small tracking-wider border-0" style={{ width: "15%" }}>Company</th>
                                <th className="py-3 text-secondary text-uppercase x-small tracking-wider border-0" style={{ width: "12%" }}>Location</th>
                                <th className="py-3 text-secondary text-uppercase x-small tracking-wider border-0" style={{ width: "8%" }}>Dist</th>
                                <th className="py-3 text-secondary text-uppercase x-small tracking-wider border-0" style={{ width: "8%" }}>Match</th>
                                <th className="py-3 text-secondary text-uppercase x-small tracking-wider border-0" style={{ width: "10%" }}>Tags</th>
                                <th className="py-3 text-secondary text-uppercase x-small tracking-wider border-0" style={{ width: "8%" }}>Applied</th>
                                <th className="pe-4 py-3 text-end text-secondary text-uppercase x-small tracking-wider border-0" style={{ width: "12%" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((job) => (
                                <tr key={job.id} className="job-row hover-bg-subtle transition-all border-bottom border-secondary border-opacity-10">
                                    <td className="ps-4 py-3 border-0">
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
                                        <div className="text-white-50 text-truncate" style={{ maxWidth: 160 }} title={job.company}>
                                            {job.company}
                                        </div>
                                    </td>
                                    <td className="border-0">
                                        <div className="text-secondary text-truncate" style={{ maxWidth: 120 }}>
                                            {job.location || "Remote"}
                                        </div>
                                    </td>
                                    <td className="border-0"><DistanceBadge km={job.distance_km} /></td>
                                    <td className="border-0">
                                        {job.affinity_score != null ? (
                                            <ScoreBadge score={Math.round(job.affinity_score)} />
                                        ) : <span className="text-muted">—</span>}
                                    </td>
                                    <td className="border-0">
                                        <div className="d-flex flex-column gap-1 align-items-start">
                                            {job.worth_applying && (
                                                <span className="badge bg-success rounded-pill py-1 fs-xs border-0 text-white">
                                                    Top Pick
                                                </span>
                                            )}
                                            {job.workload && job.workload < 100 && (
                                                <span className="badge bg-secondary rounded-pill py-1 fs-xs border-0">
                                                    {job.workload}%
                                                </span>
                                            )}
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
                                                            <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary rounded-pill px-3 shadow-sm scale-on-hover fw-medium">
                                                                Apply
                                                            </a>
                                                        )}
                                                        {job.jobroom_url && (
                                                            <a href={job.jobroom_url} target="_blank" rel="noopener noreferrer"
                                                                className={`btn btn-sm rounded-circle d-flex align-items-center justify-content-center ${isJobRoomOnly ? 'btn-outline-info' : 'btn-outline-secondary'}`}
                                                                style={{ width: 32, height: 32 }}
                                                                title="View on Job Room">
                                                                <i className="bi bi-link-45deg fs-6"></i>
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
                <div className="bg-dark bg-opacity-25 p-3 border-top border-secondary border-opacity-10">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="text-secondary x-small fw-medium">
                            Showing <span className="text-white">{(pagination.page - 1) * 20 + 1}-{Math.min(pagination.page * 20, pagination.total)}</span> of <span className="text-white">{pagination.total}</span>
                        </div>

                        {pagination.pages > 1 && (
                            <div className="d-flex align-items-center gap-2">
                                <button
                                    className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0"
                                    disabled={pagination.page === 1}
                                    onClick={() => onPageChange(pagination.page - 1)}
                                    style={{ width: 32, height: 32 }}
                                >
                                    <i className="bi bi-chevron-left"></i>
                                </button>

                                <span className="text-white small fw-bold px-2">
                                    Page {pagination.page} <span className="text-secondary fw-normal">/ {pagination.pages}</span>
                                </span>

                                <button
                                    className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0"
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
        </div>
    );
}
