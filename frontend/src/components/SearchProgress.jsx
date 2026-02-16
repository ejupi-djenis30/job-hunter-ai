import React, { useState, useEffect, useRef } from "react";
import { SearchService } from "../services/search";

export function SearchProgress({ profileId, status, setStatus, onStateChange, onClear }) {
    const logEndRef = useRef(null);
    const reportedState = useRef(null);

    useEffect(() => {
        if (!profileId) return;

        let intervalId;

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

                if (s === "done" || s === "error" || s === "stopped") {
                    clearInterval(intervalId);
                }
            } catch (e) {
                console.error("Status poll error:", e);
            }
        };

        poll();
        intervalId = setInterval(poll, 1500);
        return () => clearInterval(intervalId);
    }, [profileId, setStatus]);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [status?.log?.length]);

    const handleStop = async () => {
        if (!window.confirm("Sei sicuro di voler fermare la ricerca?")) return;
        try {
            await SearchService.stopSearch(profileId);
        } catch (e) {
            console.error("Stop error:", e);
        }
    };

    if (!status) return (
        <div className="glass-card p-5 text-center mt-4 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '300px' }}>
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
            <h5 className="text-white fw-bold">Initializing Connection</h5>
            <p className="text-secondary mb-0">Contacting agent...</p>
        </div>
    );

    const { state, total_searches, current_search_index, current_query, searches_generated, jobs_new, jobs_duplicates, jobs_skipped, errors, log } = status;
    const isRunning = state === "generating" || state === "searching" || state === "analyzing";
    const isDone = state === "done";
    const isError = state === "error" || state === "stopped";

    const progressPct = total_searches > 0 ? Math.round((current_search_index / total_searches) * 100) : 0;

    return (
        <div className="animate-fade-in py-3">
            {/* Main Status Card */}
            <div className="glass-card p-4 p-md-5 mb-4 position-relative overflow-hidden">
                {/* Background glow effect based on status */}
                <div className={`position-absolute top-0 end-0 w-50 h-100 opacity-20 blur-3xl rounded-circle translate-middle-x ${isDone ? 'bg-success' : isError ? 'bg-danger' : 'bg-primary'}`} style={{ zIndex: -1 }}></div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <div className={`rounded-circle d-flex align-items-center justify-content-center text-white shadow-lg ${isDone ? 'bg-success' : isError ? 'bg-danger' : 'bg-primary'}`} style={{ width: 56, height: 56 }}>
                            {isRunning ? <span className="spinner-border spinner-border-sm" style={{ width: '1.5rem', height: '1.5rem' }}></span>
                                : isDone ? <i className="bi bi-check-lg fs-3"></i>
                                    : <i className="bi bi-exclamation-triangle fs-3"></i>}
                        </div>
                        <div>
                            <h2 className="mb-0 fw-bold text-white">
                                {isDone ? "Search Complete" : isError ? (state === "stopped" ? "Search Stopped" : "Search Error") : "Agent Working..."}
                            </h2>
                            <p className="text-white-50 mb-0 small">
                                {state === "generating" && "Generating smart queries based on your profile"}
                                {state === "searching" && `Executing search query ${current_search_index} of ${total_searches}`}
                                {state === "analyzing" && "Analyzing jobs for relevance"}
                                {state === "done" && "All tasks finished successfully"}
                            </p>
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        {isRunning && (
                            <button className="btn btn-outline-danger border-0 bg-danger bg-opacity-10 rounded-pill px-4" onClick={handleStop}>
                                <i className="bi bi-stop-fill me-2"></i>Stop
                            </button>
                        )}
                        {(isDone || isError) && (
                            <button className="btn btn-secondary rounded-pill px-4" onClick={onClear}>
                                Close
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                {total_searches > 0 && (
                    <div className="mb-4">
                        <div className="d-flex justify-content-between text-secondary x-small fw-bold text-uppercase tracking-wider mb-2">
                            <span>Progress</span>
                            <span>{isDone ? '100%' : `${progressPct}%`}</span>
                        </div>
                        <div className="progress bg-dark bg-opacity-25" style={{ height: "10px", borderRadius: "10px" }}>
                            <div
                                className={`progress-bar ${isDone ? 'bg-success' : isError ? 'bg-danger' : 'bg-primary progress-bar-striped progress-bar-animated'}`}
                                style={{ width: `${isDone || isError ? 100 : progressPct}%`, borderRadius: "10px", transition: "width 0.5s ease" }}
                            />
                        </div>
                        {isRunning && current_query && (
                            <div className="mt-2 text-center">
                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10 rounded-pill fw-normal px-3 py-2 animate-pulse">
                                    <i className="bi bi-search me-2"></i>
                                    Scanning: "{current_query}"
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="row g-3">
                    <div className="col-6 col-md-3">
                        <div className="p-3 rounded-4 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-center">
                            <div className="display-6 fw-bold text-white mb-0">{jobs_new || 0}</div>
                            <div className="text-secondary small">New Jobs</div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="p-3 rounded-4 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-center">
                            <div className="display-6 fw-bold text-warning mb-0">{jobs_duplicates || 0}</div>
                            <div className="text-secondary small">Duplicates</div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="p-3 rounded-4 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-center">
                            <div className="display-6 fw-bold text-info mb-0">{jobs_skipped || 0}</div>
                            <div className="text-secondary small">Skipped</div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="p-3 rounded-4 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-center">
                            <div className="display-6 fw-bold text-danger mb-0">{errors || 0}</div>
                            <div className="text-secondary small">Errors</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* Generated Plan */}
                <div className="col-md-5">
                    <div className="glass-card p-0 h-100 overflow-hidden d-flex flex-column">
                        <div className="p-3 border-bottom border-secondary border-opacity-10 bg-white bg-opacity-5">
                            <h6 className="mb-0 fw-bold text-white"><i className="bi bi-diagram-3 me-2 text-primary"></i>Search Plan</h6>
                        </div>
                        <div className="flex-grow-1 overflow-auto" style={{ maxHeight: "300px" }}>
                            <ul className="list-group list-group-flush">
                                {searches_generated?.map((s, i) => {
                                    // current_search_index is 1-based from backend
                                    const currentIndex = (current_search_index || 1) - 1;
                                    const isDone = i < currentIndex;
                                    const isCurrent = i === currentIndex;

                                    return (
                                        <li key={i} className={`list-group-item bg-transparent border-bottom border-secondary border-opacity-10 px-3 py-2 d-flex gap-3 ${isCurrent ? 'bg-primary bg-opacity-10' : ''}`}>
                                            <div className="mt-1">
                                                {isDone ? (
                                                    <i className="bi bi-check-circle-fill text-success"></i>
                                                ) : isCurrent ? (
                                                    <div className="spinner-border spinner-border-sm text-primary"></div>
                                                ) : (
                                                    <div className="rounded-circle bg-secondary bg-opacity-25" style={{ width: 16, height: 16 }}></div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-xs text-uppercase tracking-wider opacity-50 mb-1">{s.type}</div>
                                                <div className={`text-sm fw-medium ${isCurrent ? 'text-white' : 'text-secondary'}`}>{s.query}</div>
                                            </div>
                                        </li>
                                    );
                                })}
                                {(!searches_generated || searches_generated.length === 0) && (
                                    <div className="p-4 text-center text-secondary small opacity-50">
                                        Planning search strategy...
                                    </div>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Live Logs */}
                <div className="col-md-7">
                    <div className="glass-card p-0 h-100 overflow-hidden d-flex flex-column">
                        <div className="p-3 border-bottom border-secondary border-opacity-10 bg-black bg-opacity-20 d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-bold text-white font-monospace"><i className="bi bi-terminal me-2"></i>Live Output</h6>
                            <div className="d-flex gap-1">
                                <div className="rounded-circle bg-danger opacity-50" style={{ width: 8, height: 8 }}></div>
                                <div className="rounded-circle bg-warning opacity-50" style={{ width: 8, height: 8 }}></div>
                                <div className="rounded-circle bg-success opacity-50" style={{ width: 8, height: 8 }}></div>
                            </div>
                        </div>
                        <div className="flex-grow-1 overflow-auto bg-black bg-opacity-50 p-3" style={{ maxHeight: "300px", fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {log && log.length > 0 ? (
                                log.map((entry, i) => (
                                    <div key={i} className="mb-1 d-flex">
                                        <span className="text-secondary opacity-50 me-2" style={{ minWidth: '60px' }}>
                                            {new Date(entry.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                        <span className="text-light">{entry.message}</span>
                                    </div>
                                ))
                            ) : (
                                <span className="text-secondary opacity-25">Waiting for logs...</span>
                            )}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
