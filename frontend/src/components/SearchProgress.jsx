import React, { useState, useEffect, useRef } from "react";
import { SearchService } from "../services/search";

export function SearchProgress({ profileId, onStateChange, onClear }) {
    const [status, setStatus] = useState(null);
    const logEndRef = useRef(null);
    const reportedState = useRef(null);

    useEffect(() => {
        if (!profileId) return;

        const poll = async () => {
            try {
                const data = await SearchService.getStatus(profileId);
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
    const isRunning = state === "generating" || state === "searching" || state === "analyzing";
    const isDone = state === "done";
    const isError = state === "error";

    const progressPct = total_searches > 0 ? Math.round((current_search_index / total_searches) * 100) : 0;

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="glass-card mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="mb-0 text-light fw-bold d-flex align-items-center">
                            {isRunning && <span className="spinner-border spinner-border-sm text-primary me-2"></span>}
                            {isDone && <i className="bi bi-check-circle-fill me-2 text-success"></i>}
                            {isError && <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>}
                            Search Progress
                        </h5>
                        {(isDone || isError) && (
                            <button className="btn btn-sm btn-outline-secondary border-opacity-25 rounded-pill px-3" onClick={onClear}>
                                <i className="bi bi-x-lg me-1"></i> Dismiss
                            </button>
                        )}
                    </div>

                    {/* State Badge */}
                    <div className="mb-4">
                        <span className={`badge ${state === "generating" ? "bg-info bg-opacity-25 text-info border border-info border-opacity-25" :
                                state === "searching" ? "bg-warning bg-opacity-25 text-warning border border-warning border-opacity-25" :
                                    state === "analyzing" ? "bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25" :
                                        state === "done" ? "bg-success bg-opacity-25 text-success border border-success border-opacity-25" :
                                            "bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25"
                            } me-2 py-2 px-3 rounded-pill`}>
                            {state === "generating" && <><i className="bi bi-robot me-2"></i>Generating Queries</>}
                            {state === "searching" && <><i className="bi bi-search me-2"></i>Searching {current_search_index}/{total_searches}</>}
                            {state === "analyzing" && <><i className="bi bi-cpu me-2"></i>Analyzing Jobs with AI</>}
                            {state === "done" && <><i className="bi bi-check-circle me-2"></i>Complete</>}
                            {state === "error" && <><i className="bi bi-exclamation-triangle me-2"></i>Error</>}
                        </span>
                        {isRunning && current_query && (
                            <span className="text-secondary small ms-2 animate-pulse">{current_query}</span>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {total_searches > 0 && (
                        <div className="progress mb-4 bg-dark bg-opacity-50 border border-secondary border-opacity-25" style={{ height: "12px", borderRadius: "6px" }}>
                            <div
                                className={`progress-bar ${isDone ? 'bg-success' : isError ? 'bg-danger' : 'bg-primary progress-bar-striped progress-bar-animated'}`}
                                style={{ width: `${isDone || isError ? 100 : progressPct}%`, transition: "width 0.5s ease" }}
                            />
                        </div>
                    )}

                    {/* Stats Row */}
                    <div className="row g-2 text-center">
                        <div className="col">
                            <div className="p-3 glass-card bg-opacity-10 rounded-3">
                                <div className="text-primary fw-bold fs-4 mb-1">{total_searches}</div>
                                <small className="text-secondary text-uppercase tracking-wider" style={{ fontSize: '0.7rem' }}>Queries</small>
                            </div>
                        </div>
                        <div className="col">
                            <div className="p-3 glass-card bg-opacity-10 rounded-3">
                                <div className="text-success fw-bold fs-4 mb-1">{jobs_new || 0}</div>
                                <small className="text-secondary text-uppercase tracking-wider" style={{ fontSize: '0.7rem' }}>New Jobs</small>
                            </div>
                        </div>
                        <div className="col">
                            <div className="p-3 glass-card bg-opacity-10 rounded-3">
                                <div className="text-warning fw-bold fs-4 mb-1">{jobs_duplicates || 0}</div>
                                <small className="text-secondary text-uppercase tracking-wider" style={{ fontSize: '0.7rem' }}>Duplicates</small>
                            </div>
                        </div>
                        <div className="col">
                            <div className="p-3 glass-card bg-opacity-10 rounded-3">
                                <div className="text-info fw-bold fs-4 mb-1">{jobs_skipped || 0}</div>
                                <small className="text-secondary text-uppercase tracking-wider" style={{ fontSize: '0.7rem' }}>Skipped</small>
                            </div>
                        </div>
                        <div className="col">
                            <div className="p-3 glass-card bg-opacity-10 rounded-3">
                                <div className="text-danger fw-bold fs-4 mb-1">{errors || 0}</div>
                                <small className="text-secondary text-uppercase tracking-wider" style={{ fontSize: '0.7rem' }}>Errors</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Generated Searches */}
            {searches_generated && searches_generated.length > 0 && (
                <div className="glass-card mb-4">
                    <div className="card-header bg-transparent border-secondary border-opacity-25 py-3">
                        <small className="text-secondary fw-bold text-uppercase tracking-wider"><i className="bi bi-robot me-2 text-primary"></i>AI Generated Searches ({searches_generated.length})</small>
                    </div>
                    <div className="card-body p-2" style={{ maxHeight: "200px", overflowY: "auto" }}>
                        {searches_generated.map((s, i) => {
                            const isActive = i + 1 === current_search_index;
                            const isDoneSearch = i + 1 < current_search_index;
                            return (
                                <div key={i} className={`d-flex align-items-center gap-3 px-3 py-2 rounded mb-1 ${isActive ? 'bg-primary bg-opacity-10 border border-primary border-opacity-25' : 'border border-transparent'}`}>
                                    <span style={{ width: 20, textAlign: "center" }}>
                                        {isDoneSearch ? <i className="bi bi-check-lg text-success"></i> : isActive ? <div className="spinner-border spinner-border-sm text-primary" style={{ width: '1rem', height: '1rem' }} /> : <i className="bi bi-hourglass text-secondary opacity-50"></i>}
                                    </span>
                                    <span className="badge bg-secondary bg-opacity-25 text-secondary border border-secondary border-opacity-25" style={{ minWidth: 80 }}>
                                        {s.type}
                                    </span>
                                    <small className={`${isActive ? 'text-light fw-medium' : 'text-secondary'}`}>
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
                <div className="glass-card overflow-hidden">
                    <div className="card-header bg-black bg-opacity-25 border-secondary border-opacity-25 py-2 d-flex align-items-center">
                        <div className="d-flex gap-2 me-3">
                            <div className="rounded-circle bg-danger" style={{ width: 10, height: 10 }}></div>
                            <div className="rounded-circle bg-warning" style={{ width: 10, height: 10 }}></div>
                            <div className="rounded-circle bg-success" style={{ width: 10, height: 10 }}></div>
                        </div>
                        <small className="text-secondary fw-bold font-monospace"><i className="bi bi-terminal me-2"></i>Live Log</small>
                    </div>
                    <div className="card-body p-0 bg-black bg-opacity-50" style={{ maxHeight: "300px", overflowY: "auto" }}>
                        <div className="p-3 font-monospace" style={{ fontSize: "12px" }}>
                            {log.map((entry, i) => (
                                <div key={i} className="py-1 border-bottom border-secondary border-opacity-10">
                                    <span className="text-secondary me-3 opacity-50 select-none">
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
