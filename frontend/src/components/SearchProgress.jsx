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
        if (!window.confirm("Are you sure you want to stop the search?")) return;
        try {
            await SearchService.stopSearch(profileId);
        } catch (e) {
            console.error("Stop error:", e);
        }
    };

    if (!status) return (
        <div className="glass-panel p-5 text-center mt-4 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary mb-4" role="status" style={{ width: '3rem', height: '3rem' }}></div>
            <h5 className="text-white fw-bold">Initializing Uplink</h5>
            <p className="text-secondary mb-0 font-monospace small">Connecting to agent swarm...</p>
        </div>
    );

    const { state, total_searches, current_search_index, current_query, searches_generated, jobs_new, jobs_duplicates, jobs_skipped, errors, log } = status;
    const isRunning = state === "generating" || state === "searching" || state === "analyzing";
    const isDone = state === "done";
    const isError = state === "error" || state === "stopped";

    const progressPct = total_searches > 0 ? Math.round((current_search_index / total_searches) * 100) : 0;

    return (
        <div className="animate-fade-in py-3 h-100 d-flex flex-column">
            {/* Main Status Header */}
            <div className="glass-panel p-4 mb-4 position-relative overflow-hidden">
                {/* Background Ambient Glow Removed */}

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-4 mb-4">
                    <div className="d-flex align-items-center gap-4">
                        <div className={`rounded-circle d-flex align-items-center justify-content-center text-white shadow-lg border border-white-10 ${isDone ? 'bg-success' : isError ? 'bg-danger' : 'bg-primary'}`} style={{ width: 64, height: 64 }}>
                            {isRunning ? <span className="spinner-border spinner-border-sm" style={{ width: '2rem', height: '2rem' }}></span>
                                : isDone ? <i className="bi bi-check-lg fs-2"></i>
                                    : <i className="bi bi-exclamation-triangle fs-2"></i>}
                        </div>
                        <div>
                            <h2 className="mb-0 fw-bold text-white tracking-tight">
                                {isDone ? "Mission Complete" : isError ? (state === "stopped" ? "Mission Aborted" : "Mission Failed") : "Agent Active"}
                            </h2>
                            <p className="text-white-50 mb-0 font-monospace small">
                                {state === "generating" && "Generating tactical search vector..."}
                                {state === "searching" && `Executing vector ${current_search_index} / ${total_searches}...`}
                                {state === "analyzing" && "Analyzing intelligence data..."}
                                {state === "done" && "All objectives secured."}
                            </p>
                        </div>
                    </div>

                    <div className="d-flex gap-3">
                        {isRunning && (
                            <button className="btn btn-outline-danger border-white-10 bg-black-20 rounded-pill px-4 hover-bg-danger hover-text-white transition-all" onClick={handleStop}>
                                <i className="bi bi-stop-circle me-2"></i>Abort
                            </button>
                        )}
                        {(isDone || isError) && (
                            <button className="btn btn-secondary rounded-pill px-5 shadow-glow" onClick={onClear}>
                                Close Debrief
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                {total_searches > 0 && (
                    <div className="mb-4">
                        <div className="d-flex justify-content-between text-secondary x-small fw-bold text-uppercase tracking-wider mb-2">
                            <span>Mission Progress</span>
                            <span className="text-white">{isDone ? '100%' : `${progressPct}%`}</span>
                        </div>
                        <div className="progress bg-black-50 border border-white-5" style={{ height: "8px", borderRadius: "8px" }}>
                            <div
                                className={`progress-bar ${isDone ? 'bg-success shadow-glow' : isError ? 'bg-danger' : 'bg-primary shadow-glow progress-bar-striped progress-bar-animated'}`}
                                style={{ width: `${isDone || isError ? 100 : progressPct}%`, borderRadius: "8px", transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
                            />
                        </div>
                        {isRunning && current_query && (
                            <div className="mt-2 text-center animate-slide-up">
                                <span className="badge bg-primary-10 text-primary border border-primary-20 rounded-pill fw-normal px-3 py-1 font-monospace small">
                                    <i className="bi bi-crosshair me-2"></i>
                                    TARGET: "{current_query}"
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="row g-3">
                    {[
                        { label: 'New Intel', value: jobs_new, color: 'text-white' },
                        { label: 'Duplicates', value: jobs_duplicates, color: 'text-warning' },
                        { label: 'Skipped', value: jobs_skipped, color: 'text-secondary' },
                        { label: 'Errors', value: errors, color: 'text-danger' }
                    ].map((stat, i) => (
                        <div key={i} className="col-6 col-md-3">
                            <div className="p-3 rounded-4 bg-black-20 border border-white-5 text-center">
                                <div className={`display-6 fw-bold mb-0 ${stat.color}`}>{stat.value || 0}</div>
                                <div className="text-secondary x-small text-uppercase tracking-wide opacity-75">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="row g-4 flex-grow-1" style={{ minHeight: '400px' }}>
                {/* Generated Plan */}
                <div className="col-lg-5 d-flex flex-column">
                    <div className="glass-panel p-0 h-100 overflow-hidden d-flex flex-column">
                        <div className="p-3 border-bottom border-white-10 bg-white-5">
                            <h6 className="mb-0 fw-bold text-white small text-uppercase tracking-wide"><i className="bi bi-diagram-3 me-2 text-primary"></i>Tactical Plan</h6>
                        </div>
                        <div className="flex-grow-1 overflow-auto custom-scrollbar p-0">
                            <ul className="list-group list-group-flush">
                                {searches_generated?.map((s, i) => {
                                    const currentIndex = (current_search_index || 1) - 1;
                                    const isDone = i < currentIndex;
                                    const isCurrent = i === currentIndex;

                                    return (
                                        <li key={i} className={`list-group-item bg-transparent border-bottom border-white-5 px-3 py-3 d-flex gap-3 ${isCurrent ? 'bg-primary-10' : ''}`}>
                                            <div className="mt-1">
                                                {isDone ? (
                                                    <i className="bi bi-check-circle-fill text-success"></i>
                                                ) : isCurrent ? (
                                                    <div className="spinner-border spinner-border-sm text-primary"></div>
                                                ) : (
                                                    <div className="rounded-circle bg-white-10 border border-white-10" style={{ width: 16, height: 16 }}></div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="x-small text-uppercase tracking-wider opacity-50 mb-1 text-secondary">{s.type}</div>
                                                <div className={`text-sm fw-medium font-monospace ${isCurrent ? 'text-primary' : 'text-secondary'}`}>{s.query}</div>
                                            </div>
                                        </li>
                                    );
                                })}
                                {(!searches_generated || searches_generated.length === 0) && (
                                    <div className="p-5 text-center text-secondary opacity-50 d-flex flex-column align-items-center">
                                        <div className="spinner-grow spinner-grow-sm mb-3"></div>
                                        <span className="small">Formulating strategy...</span>
                                    </div>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Live Logs */}
                <div className="col-lg-7 d-flex flex-column">
                    <div className="glass-panel p-0 h-100 overflow-hidden d-flex flex-column border-0 shadow-lg">
                        <div className="p-2 border-bottom border-white-10 bg-black d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center px-2">
                                <i className="bi bi-terminal-fill text-secondary me-2"></i>
                                <span className="text-secondary x-small fw-bold font-monospace">AGENT_LOG_OUTPUT</span>
                            </div>
                        </div>
                        <div className="flex-grow-1 overflow-auto bg-black p-3 custom-scrollbar" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem' }}>
                            {log && log.length > 0 ? (
                                log.map((entry, i) => (
                                    <div key={i} className="mb-1 d-flex">
                                        <span className="text-secondary opacity-50 me-2 select-none" style={{ minWidth: '70px' }}>
                                            [{new Date(entry.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                        </span>
                                        <span className="text-light text-break">{entry.message}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="h-100 d-flex align-items-center justify-content-center text-secondary opacity-25">
                                    <span>_waiting_for_stream</span>
                                </div>
                            )}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
