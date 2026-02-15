import React from "react";

function ScoreBadge({ score }) {
    let cls = "badge ";
    if (score >= 75) cls += "bg-success";
    else if (score >= 50) cls += "bg-warning text-dark";
    else cls += "bg-danger";
    return <span className={cls}>{score}%</span>;
}

export function JobTable({ jobs, onToggleApplied }) {
    if (!jobs || jobs.length === 0) {
        return (
            <div className="card bg-dark border-secondary">
                <div className="card-body text-center py-5">
                    <p className="fs-5 text-secondary mb-1">No jobs found yet</p>
                    <p className="text-secondary small">Start a new search to discover opportunities</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-dark border-secondary">
            {/* Desktop Table View */}
            <div className="table-responsive d-none d-md-block">
                <table className="table table-dark table-hover mb-0 align-middle">
                    <thead>
                        <tr className="text-secondary small text-uppercase">
                            <th>Title / Company</th>
                            <th>Location</th>
                            <th>Match</th>
                            <th>Posted</th>
                            <th>Status</th>
                            <th>Links</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map((job) => (
                            <tr key={job.id}>
                                <td>
                                    <div className="fw-semibold text-light">{job.title}</div>
                                    <small className="text-secondary">{job.company}</small>
                                    {job.workload && <small className="text-secondary d-block">{job.workload}</small>}
                                </td>
                                <td><small className="text-secondary">{job.location || '-'}</small></td>
                                <td>
                                    <ScoreBadge score={job.affinity_score || 0} />
                                    {/* Worth applying badge */}
                                    {job.worth_applying && (
                                        <span
                                            className="badge bg-info text-dark ms-1"
                                            title="This job might be worth applying for despite the score"
                                        >
                                            <i className="bi bi-lightbulb-fill me-1"></i> Worth it
                                        </span>
                                    )}
                                    {job.affinity_analysis && (
                                        <div className="text-secondary small mt-1" style={{ maxWidth: 200 }} title={job.affinity_analysis}>
                                            {job.affinity_analysis.length > 60
                                                ? job.affinity_analysis.substring(0, 60) + '...'
                                                : job.affinity_analysis
                                            }
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <small className="text-secondary">
                                        {job.publication_date
                                            ? new Date(job.publication_date).toLocaleDateString()
                                            : '-'}
                                    </small>
                                </td>
                                <td>
                                    <button
                                        onClick={() => onToggleApplied(job)}
                                        className={`btn btn-sm ${job.applied ? 'btn-success' : 'btn-outline-secondary'}`}
                                    >
                                        {job.applied ? <><i className="bi bi-check-circle-fill me-1"></i> Applied</> : <><i className="bi bi-circle me-1"></i> Apply</>}
                                    </button>
                                </td>
                                <td>
                                    <div className="d-flex flex-column gap-1">
                                        <div className="d-flex gap-1">
                                            {job.url && (
                                                <a
                                                    href={job.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-outline-primary"
                                                    title="External job posting"
                                                >
                                                    <i className="bi bi-box-arrow-up-right"></i>
                                                </a>
                                            )}
                                            {job.jobroom_url && (
                                                <a
                                                    href={job.jobroom_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-outline-info"
                                                    title="View on Job-Room.ch"
                                                >
                                                    <i className="bi bi-building"></i>
                                                </a>
                                            )}
                                        </div>
                                        {job.application_email && (
                                            <a
                                                href={`mailto:${job.application_email}`}
                                                className="btn btn-sm btn-outline-warning"
                                                title={`Send application to ${job.application_email}`}
                                            >
                                                <i className="bi bi-envelope me-1"></i>
                                                Email
                                            </a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="d-md-none">
                {jobs.map((job) => (
                    <div key={job.id} className="p-3 border-bottom border-secondary">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <div className="fw-bold text-light">{job.title}</div>
                                <div className="small text-secondary">{job.company}</div>
                            </div>
                            <ScoreBadge score={job.affinity_score || 0} />
                        </div>

                        <div className="mb-2">
                            <div className="small text-secondary"><i className="bi bi-geo-alt me-1"></i>{job.location || 'Unknown'}</div>
                            {job.workload && <div className="small text-secondary"><i className="bi bi-briefcase me-1"></i>{job.workload}</div>}
                            <div className="small text-secondary"><i className="bi bi-calendar3 me-1"></i>{job.publication_date ? new Date(job.publication_date).toLocaleDateString() : '-'}</div>
                        </div>

                        {job.worth_applying && (
                            <div className="mb-2">
                                <span className="badge bg-info text-dark">
                                    <i className="bi bi-lightbulb-fill me-1"></i> Worth applying
                                </span>
                            </div>
                        )}

                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <div className="btn-group">
                                {job.url && (
                                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                        <i className="bi bi-box-arrow-up-right"></i>
                                    </a>
                                )}
                                {job.jobroom_url && (
                                    <a href={job.jobroom_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info">
                                        <i className="bi bi-building"></i>
                                    </a>
                                )}
                                {job.application_email && (
                                    <a href={`mailto:${job.application_email}`} className="btn btn-sm btn-outline-warning">
                                        <i className="bi bi-envelope"></i>
                                    </a>
                                )}
                            </div>
                            <button
                                onClick={() => onToggleApplied(job)}
                                className={`btn btn-sm ${job.applied ? 'btn-success' : 'btn-outline-secondary'}`}
                            >
                                {job.applied ? <><i className="bi bi-check-circle-fill me-1"></i> Applied</> : <><i className="bi bi-circle me-1"></i> Apply</>}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
