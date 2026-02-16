import React from "react";

function ScoreBadge({ score }) {
    let cls = "badge ";
    if (score >= 75) cls += "bg-success";
    else if (score >= 50) cls += "bg-warning text-dark";
    else cls += "bg-danger";
    return <span className={cls}>{score}%</span>;
}

function DistanceBadge({ km }) {
    if (km == null) return <span className="text-muted">—</span>;
    let cls = "badge ";
    if (km <= 15) cls += "bg-success";
    else if (km <= 40) cls += "bg-info text-dark";
    else cls += "bg-secondary";
    return <span className={cls}>{km} km</span>;
}

// Mobile Card Component
function JobCard({ job, onToggleApplied }) {
    // Determine if it's a "Job Room only" link situation
    const isJobRoomOnly = job.jobroom_url && (!job.url || job.url === job.jobroom_url);
    const applyUrl = isJobRoomOnly ? null : job.url;

    return (
        <div className="glass-card p-3 mb-3 position-relative group">
            <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <h5 className="fw-bold mb-1 text-light">{job.title}</h5>
                    <div className="text-secondary small mb-2">
                        <i className="bi bi-building me-1"></i>{job.company}
                        <span className="mx-2">•</span>
                        <i className="bi bi-geo-alt me-1"></i>{job.location || "Remote"}
                    </div>
                </div>
                {job.affinity_score != null && (
                    <ScoreBadge score={Math.round(job.affinity_score)} />
                )}
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3">
                <DistanceBadge km={job.distance_km} />
                {job.worth_applying && (
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                        <i className="bi bi-star-fill me-1"></i>Top Pick
                    </span>
                )}
                {job.workload && (
                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25">
                        {job.workload}%
                    </span>
                )}
            </div>

            <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-25">
                <div className="d-flex gap-2">
                    {applyUrl && (
                        <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary rounded-pill">
                            Apply <i className="bi bi-box-arrow-up-right ms-1"></i>
                        </a>
                    )}
                    {job.application_email && (
                        <a href={`mailto:${job.application_email}`} className="btn btn-sm btn-outline-secondary rounded-pill">
                            <i className="bi bi-envelope"></i>
                        </a>
                    )}
                    {(job.jobroom_url) && (
                        <a href={job.jobroom_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary rounded-pill" title="View on Job Room">
                            <i className="bi bi-link-45deg"></i>
                        </a>
                    )}
                </div>

                <div className="form-check form-switch">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={job.applied}
                        onChange={() => onToggleApplied(job)}
                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                    />
                </div>
            </div>
        </div>
    );
}

export function JobTable({ jobs, onToggleApplied, pagination, onPageChange }) {
    if (!jobs || jobs.length === 0) {
        return (
            <div className="glass-card text-center py-5 animate-fade-in">
                <div className="mb-3">
                    <div className="rounded-circle bg-secondary bg-opacity-10 d-inline-flex align-items-center justify-content-center" style={{ width: 80, height: 80 }}>
                        <i className="bi bi-search fs-1 text-secondary opacity-50"></i>
                    </div>
                </div>
                <h5 className="text-light">No jobs found</h5>
                <p className="text-secondary small">Adjust your filters or start a new search.</p>
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
            <div className="d-none d-lg-block glass-card overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-dark table-hover align-middle mb-0">
                        <thead className="bg-dark bg-opacity-50">
                            <tr>
                                <th className="ps-4 text-secondary text-uppercase small tracking-wider" style={{ width: "25%" }}>Job Title</th>
                                <th className="text-secondary text-uppercase small tracking-wider" style={{ width: "15%" }}>Company</th>
                                <th className="text-secondary text-uppercase small tracking-wider" style={{ width: "12%" }}>Location</th>
                                <th className="text-secondary text-uppercase small tracking-wider" style={{ width: "8%" }}>Dist</th>
                                <th className="text-secondary text-uppercase small tracking-wider" style={{ width: "8%" }}>Match</th>
                                <th className="text-secondary text-uppercase small tracking-wider" style={{ width: "10%" }}>Status</th>
                                <th className="text-secondary text-uppercase small tracking-wider" style={{ width: "8%" }}>Applied</th>
                                <th className="pe-4 text-end text-secondary text-uppercase small tracking-wider" style={{ width: "12%" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((job) => (
                                <tr key={job.id} style={{ cursor: 'default' }}>
                                    <td className="ps-4">
                                        <div className="fw-bold text-light text-truncate" style={{ maxWidth: 280 }} title={job.title}>
                                            {job.title}
                                        </div>
                                        <div className="small text-secondary mt-1">
                                            {job.publication_date && (
                                                <span className="me-2 text-info" title="Pubblicato il">
                                                    <i className="bi bi-calendar-event me-1"></i>
                                                    {new Date(job.publication_date).toLocaleDateString()}
                                                </span>
                                            )}
                                            <span title="Scrappato il">
                                                <i className="bi bi-cloud-download me-1"></i>
                                                {new Date(job.created_at).toLocaleDateString()}
                                            </span>
                                            {job.workload && <span className="ms-2 badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25">{job.workload}%</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-light text-truncate" style={{ maxWidth: 160 }} title={job.company}>
                                            {job.company}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-secondary text-truncate" style={{ maxWidth: 120 }}>
                                            <i className="bi bi-geo-alt me-1 opacity-50"></i>
                                            {job.location || "Remote"}
                                        </div>
                                        {job.application_email && (
                                            <div className="small text-secondary mt-1 text-truncate" title={job.application_email}>
                                                <i className="bi bi-envelope me-1 opacity-50"></i>
                                                {job.application_email}
                                            </div>
                                        )}
                                    </td>
                                    <td><DistanceBadge km={job.distance_km} /></td>
                                    <td>
                                        {job.affinity_score != null ? (
                                            <ScoreBadge score={Math.round(job.affinity_score)} />
                                        ) : <span className="text-muted">—</span>}
                                    </td>
                                    <td>
                                        {job.worth_applying && (
                                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill">
                                                Recommended
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="form-check form-switch ms-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={job.applied}
                                                onChange={() => onToggleApplied(job)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </div>
                                    </td>
                                    <td className="pe-4 text-end">
                                        <div className="d-flex justify-content-end gap-2">
                                            {(() => {
                                                const isJobRoomOnly = job.jobroom_url && (!job.url || job.url === job.jobroom_url);
                                                const applyUrl = isJobRoomOnly ? null : job.url;
                                                return (
                                                    <>
                                                        {applyUrl && (
                                                            <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary rounded-pill px-3">
                                                                Apply
                                                            </a>
                                                        )}
                                                        {job.jobroom_url && (
                                                            <a href={job.jobroom_url} target="_blank" rel="noopener noreferrer"
                                                                className={`btn btn-sm rounded-pill px-2 ${isJobRoomOnly ? 'btn-outline-info' : 'btn-outline-secondary'}`}
                                                                title="View on Job Room">
                                                                <i className="bi bi-link-45deg"></i>
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
                <div className="bg-dark bg-opacity-50 border-top border-secondary border-opacity-10 p-3 d-flex justify-content-between align-items-center">
                    <div className="text-secondary small">
                        Showing {(pagination.page - 1) * 20 + 1} to {Math.min(pagination.page * 20, pagination.total)} of {pagination.total} jobs
                    </div>
                    {pagination.pages > 1 && (
                        <nav>
                            <ul className="pagination pagination-sm mb-0">
                                <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link bg-dark border-secondary bg-opacity-50 text-light" onClick={() => onPageChange(pagination.page - 1)}>
                                        <i className="bi bi-chevron-left"></i>
                                    </button>
                                </li>
                                {[...Array(pagination.pages)].map((_, i) => (
                                    <li key={i} className={`page-item ${pagination.page === i + 1 ? 'active' : ''}`}>
                                        <button className="page-link bg-dark border-secondary bg-opacity-50 text-light" onClick={() => onPageChange(i + 1)}>
                                            {i + 1}
                                        </button>
                                    </li>
                                )).slice(Math.max(0, pagination.page - 3), Math.min(pagination.pages, pagination.page + 2))}
                                <li className={`page-item ${pagination.page === pagination.pages ? 'disabled' : ''}`}>
                                    <button className="page-link bg-dark border-secondary bg-opacity-50 text-light" onClick={() => onPageChange(pagination.page + 1)}>
                                        <i className="bi bi-chevron-right"></i>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </div>
            </div>
        </div>
    );
}
