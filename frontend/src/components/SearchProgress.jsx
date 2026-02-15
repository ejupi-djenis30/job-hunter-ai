import React, { useState, useEffect, useRef } from "react";
import { api } from "../api";

export function SearchProgress({ profileId, onStateChange, onClear }) {
    const [status, setStatus] = useState(null);
    const logEndRef = useRef(null);
    const reportedState = useRef(null);

    useEffect(() => {
        if (!profileId) return;

        const poll = async () => {
            try {
                const data = await api.getSearchStatus(profileId);
                setStatus(data);

                // Notify parent of state changes
                const s = data.state;
                if ((s === "done" || s === "error") && reportedState.current !== s) {
                    reportedState.current = s;
                    onStateChange?.(s);
                }

                if (s === "done" || s === "error") {
                    clearInterval(interval);
                }
            } catch (e) {
                console.error("Status poll error:", e);
            }
        };

        poll();
        const interval = setInterval(poll, 1500);
        return () => clearInterval(interval);
    }, [profileId]);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [status?.log?.length]);

    if (!status || status.state === "unknown") {
        return (
            <div className="card bg-dark border-secondary">
                <div className="card-body text-center py-5">
                    <div className="spinner-border text-primary mb-3" />
                    <p className="text-secondary">Connecting to search agent...</p>
                </div>
            </div>
        );
    }

    const { state, total_searches, current_search_index, current_query, searches_generated, jobs_new, jobs_duplicates, jobs_skipped, errors, log } = status;
    const isRunning = state === "generating" || state === "searching";
    const isDone = state === "done";
    const isError = state === "error";

    const progressPct = total_searches > 0 ? Math.round((current_search_index / total_searches) * 100) : 0;

    return (
        <div>
            {/* Header */}
            <div className="card bg-dark border-secondary mb-3">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0 text-light">
                            {isRunning && <i className="bi bi-arrow-clockwise me-2 spinner-border-sm"></i>}
                            {isDone && <i className="bi bi-check-circle-fill me-2 text-success"></i>}
                            {isError && <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>}
                            Search Progress
                        </h5>
                        {(isDone || isError) && (
                            <button className="btn btn-sm btn-outline-secondary" onClick={onClear}>
                                <i className="bi bi-x-lg me-1"></i> Dismiss
                            </button>
                        )}
                    </div>

                    {/* State Badge */}
                    <div className="mb-3">
                        <span className={`badge ${state === "generating" ? "bg-info" :
                            state === "searching" ? "bg-warning text-dark" :
                                state === "done" ? "bg-success" :
                                    "bg-danger"
                            } me-2`}>
                            {state === "generating" && <><i className="bi bi-robot me-1"></i>Generating Queries</>}
                            {state === "searching" && <><i className="bi bi-search me-1"></i>Searching {current_search_index}/{total_searches}</>}
                            {state === "done" && <><i className="bi bi-check-circle me-1"></i>Complete</>}
                            {state === "error" && <><i className="bi bi-exclamation-triangle me-1"></i>Error</>}
                        </span>
                        {isRunning && current_query && (
                            <span className="text-secondary small">{current_query}</span>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {total_searches > 0 && (
                        <div className="progress mb-3" style={{ height: "8px" }}>
                            <div
                                className={`progress-bar ${isDone ? 'bg-success' : isError ? 'bg-danger' : 'progress-bar-striped progress-bar-animated'}`}
                                style={{ width: `${isDone || isError ? 100 : progressPct}%` }}
                            />
                        </div>
                    )}

                    {/* Stats Row */}
                    <div className="row g-2 text-center">
                        <div className="col">
                            <div className="text-primary fw-bold fs-5">{total_searches}</div>
                            <small className="text-secondary">Queries</small>
                        </div>
                        <div className="col">
                            <div className="text-success fw-bold fs-5">{jobs_new || 0}</div>
                            <small className="text-secondary">New Jobs</small>
                        </div>
                        <div className="col">
                            <div className="text-warning fw-bold fs-5">{jobs_duplicates || 0}</div>
                            <small className="text-secondary">Duplicates</small>
                        </div>
                        <div className="col">
                            <div className="text-info fw-bold fs-5">{jobs_skipped || 0}</div>
                            <small className="text-secondary">Skipped</small>
                        </div>
                        <div className="col">
                            <div className="text-danger fw-bold fs-5">{errors || 0}</div>
                            <small className="text-secondary">Errors</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Generated Searches */}
            {searches_generated && searches_generated.length > 0 && (
                <div className="card bg-dark border-secondary mb-3">
                    <div className="card-header border-secondary py-2">
                        <small className="text-secondary fw-bold"><i className="bi bi-robot me-1"></i>AI Generated Searches ({searches_generated.length})</small>
                    </div>
                    <div className="card-body p-2" style={{ maxHeight: "150px", overflowY: "auto" }}>
                        {searches_generated.map((s, i) => {
                            const isActive = i + 1 === current_search_index;
                            const isDoneSearch = i + 1 < current_search_index;
                            return (
                                <div key={i} className={`d-flex align-items-center gap-2 px-2 py-1 rounded ${isActive ? 'bg-primary bg-opacity-10' : ''}`}>
                                    <span style={{ width: 18, textAlign: "center" }}>
                                        {isDoneSearch ? <i className="bi bi-check-lg text-success"></i> : isActive ? <i className="bi bi-arrow-clockwise text-primary"></i> : <i className="bi bi-hourglass text-secondary"></i>}
                                    </span>
                                    <span className="badge bg-secondary" style={{ minWidth: 70 }}>
                                        {s.type}
                                    </span>
                                    <small className={`${isActive ? 'text-light' : 'text-secondary'}`}>
                                        {s.type === "combined"
                                            ? `${s.occupation} + ${s.keywords}`
                                            : s.value}
                                    </small>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Live Log */}
            {log && log.length > 0 && (
                <div className="card bg-dark border-secondary">
                    <div className="card-header border-secondary py-2">
                        <small className="text-secondary fw-bold"><i className="bi bi-terminal me-1"></i>Live Log</small>
                    </div>
                    <div className="card-body p-0" style={{ maxHeight: "300px", overflowY: "auto" }}>
                        <div className="p-2 font-monospace" style={{ fontSize: "12px" }}>
                            {log.map((entry, i) => (
                                <div key={i} className="py-0">
                                    <span className="text-secondary me-2">
                                        {new Date(entry.time).toLocaleTimeString()}
                                    </span>
                                    <span className="text-light">{entry.message}</span>
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
