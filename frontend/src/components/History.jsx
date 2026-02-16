import React, { useState, useEffect } from "react";
import { SearchService } from "../services/search";

export function History({ onStartSearch, onEdit, onSaveAsSchedule }) {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            const data = await SearchService.getProfiles();
            // Sort by ID descending (newest first)
            setProfiles(data.sort((a, b) => b.id - a.id));
        } catch (e) {
            console.error("Failed to load profiles:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleRunAgain = async (profile) => {
        if (onStartSearch) {
            onStartSearch(profile);
        }
    };



    const handleDelete = async (profileId) => {
        if (!window.confirm("Delete this history entry?")) return;
        try {
            await SearchService.deleteProfile(profileId);
            loadProfiles();
        } catch (e) {
            alert("Failed to delete: " + e.message);
        }
    };

    if (loading) {
        return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
    }

    if (!profiles.length) {
        return (
            <div className="glass-card text-center py-5 animate-fade-in">
                <div className="card-body text-secondary">
                    <i className="bi bi-clock-history display-4 opacity-50 mb-3"></i>
                    <p className="fs-5">No search history yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 text-light fw-bold">
                    <i className="bi bi-calendar3 me-2 text-primary"></i>Recent Searches
                </h5>
                <button onClick={loadProfiles} className="btn btn-sm btn-outline-secondary rounded-circle">
                    <i className="bi bi-arrow-clockwise"></i>
                </button>
            </div>

            <div className="table-responsive glass-card border-0">
                <table className="table table-hover table-dark mb-0 bg-transparent align-middle">
                    <thead className="bg-white bg-opacity-5">
                        <tr className="border-0">
                            <th className="border-0 px-4 py-3 text-secondary small text-uppercase">Search Name</th>
                            <th className="border-0 py-3 text-secondary small text-uppercase">Role / Description</th>
                            <th className="border-0 py-3 text-secondary small text-uppercase">Location</th>
                            <th className="border-0 py-3 text-secondary small text-uppercase text-end px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {profiles.map(p => (
                            <tr key={p.id} className="border-secondary border-opacity-10">
                                <td className="px-4 py-3">
                                    <div className="text-light fw-medium">{p.name}</div>
                                    <div className="text-secondary smaller">ID: {p.id}</div>
                                </td>
                                <td className="py-3">
                                    <div className="text-secondary text-truncate" style={{ maxWidth: '250px' }}>
                                        {p.role_description}
                                    </div>
                                </td>
                                <td className="py-3 text-secondary">
                                    {p.location_filter || "Any"}
                                </td>
                                <td className="py-3 text-end px-4">
                                    <div className="d-flex justify-content-end gap-2">
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleRunAgain(p)}
                                            title="Rifai Ricerca"
                                        >
                                            <i className="bi bi-play-fill me-1"></i>Run
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-info"
                                            onClick={() => onEdit?.(p)}
                                            title="Modifica parametri"
                                        >
                                            <i className="bi bi-pencil-square me-1"></i>Edit
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-success"
                                            onClick={() => onSaveAsSchedule?.(p)}
                                            title="Attiva Schedulazione"
                                        >
                                            <i className="bi bi-calendar-check me-1"></i>Schedule
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDelete(p.id)}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
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
