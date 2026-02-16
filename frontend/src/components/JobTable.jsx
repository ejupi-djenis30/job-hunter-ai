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

export function JobTable({ jobs, onToggleApplied }) {
    if (!jobs || jobs.length === 0) {
        return (
            <div className="card bg-dark border-secondary">
                <div className="card-body text-center py-5">
                    <i className="bi bi-briefcase fs-1 text-muted"></i>
                    <p className="text-muted mt-3 mb-0">No jobs found yet. Start a search to discover opportunities!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-dark border-secondary">
            <div className="table-responsive">
                <table className="table table-dark table-hover table-striped mb-0">
                    <thead>
                        <tr>
                            <th style={{ width: "5%" }}>#</th>
                            <th style={{ width: "25%" }}>Title</th>
                            <th style={{ width: "15%" }}>Company</th>
                            <th style={{ width: "10%" }}>Location</th>
                            <th style={{ width: "8%" }}>Distance</th>
                            <th style={{ width: "8%" }}>Workload</th>
                            <th style={{ width: "7%" }}>Score</th>
                            <th style={{ width: "7%" }}>Worth</th>
                            <th style={{ width: "8%" }}>Applied</th>
                            <th style={{ width: "7%" }}>Links</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map((job, idx) => (
                            <tr key={job.id}>
                                <td className="text-muted">{idx + 1}</td>
                                <td>
                                    <div className="fw-semibold text-truncate" style={{ maxWidth: 280 }} title={job.title}>
                                        {job.title}
                                    </div>
                                    {job.publication_date && (
                                        <small className="text-muted">
                                            {new Date(job.publication_date).toLocaleDateString()}
                                        </small>
                                    )}
                                </td>
                                <td className="text-truncate" style={{ maxWidth: 160 }} title={job.company}>
                                    {job.company}
                                </td>
                                <td className="text-truncate" style={{ maxWidth: 120 }} title={job.location}>
                                    {job.location || "—"}
                                </td>
                                <td>
                                    <DistanceBadge km={job.distance_km} />
                                </td>
                                <td>{job.workload || "—"}</td>
                                <td>
                                    {job.affinity_score != null ? (
                                        <ScoreBadge score={Math.round(job.affinity_score)} />
                                    ) : (
                                        <span className="text-muted">—</span>
                                    )}
                                </td>
                                <td>
                                    {job.worth_applying ? (
                                        <span className="badge bg-success">
                                            <i className="bi bi-check-lg"></i> Yes
                                        </span>
                                    ) : (
                                        <span className="badge bg-secondary">No</span>
                                    )}
                                </td>
                                <td>
                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={job.applied}
                                            onChange={() => onToggleApplied(job.id, !job.applied)}
                                        />
                                    </div>
                                </td>
                                <td>
                                    <div className="d-flex gap-1">
                                        {job.url && (
                                            <a
                                                href={job.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-outline-primary"
                                                title="View job"
                                            >
                                                <i className="bi bi-box-arrow-up-right"></i>
                                            </a>
                                        )}
                                        {job.application_email && (
                                            <a
                                                href={`mailto:${job.application_email}`}
                                                className="btn btn-sm btn-outline-success"
                                                title="Send email"
                                            >
                                                <i className="bi bi-envelope"></i>
                                            </a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="card-footer bg-dark border-secondary text-muted small">
                Showing {jobs.length} job{jobs.length !== 1 ? "s" : ""}
            </div>
        </div>
    );
}
