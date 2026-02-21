import React from "react";

export function LiveLogs({ log, logEndRef }) {
    return (
        <div className="col-lg-7 d-flex flex-column h-100">
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
    );
}
