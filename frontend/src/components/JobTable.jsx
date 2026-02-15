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
            <div className="table-responsive">
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
                                            💡 Worth it
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
                                        {job.applied ? '✅ Applied' : '⬜ Apply'}
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
                                                    🔗 Job
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
                                                    🏛️ JobRoom
                                                </a>
                                            )}
                                        </div>
                                        {job.application_email && (
                                            <a
                                                href={`mailto:${job.application_email}`}
                                                className="btn btn-sm btn-outline-warning"
                                                title={`Send application to ${job.application_email}`}
                                            >
                                                📧 {job.application_email.length > 20
                                                    ? job.application_email.substring(0, 20) + '...'
                                                    : job.application_email}
                                            </a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
