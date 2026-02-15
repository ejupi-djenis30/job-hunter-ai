const API_BASE = "http://localhost:8000";

// ─── Token Management ───
function getToken() {
    return localStorage.getItem("jh_token");
}

function authHeaders() {
    const token = getToken();
    if (!token) return { "Content-Type": "application/json" };
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export const api = {
    // ─── Auth ───
    register: async (username, password) => {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Registration failed");
        }
        const data = await res.json();
        localStorage.setItem("jh_token", data.access_token);
        localStorage.setItem("jh_username", data.username);
        return data;
    },

    login: async (username, password) => {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Login failed");
        }
        const data = await res.json();
        localStorage.setItem("jh_token", data.access_token);
        localStorage.setItem("jh_username", data.username);
        return data;
    },

    logout: () => {
        localStorage.removeItem("jh_token");
        localStorage.removeItem("jh_username");
    },

    getUsername: () => localStorage.getItem("jh_username"),
    isLoggedIn: () => !!getToken(),

    // ─── Jobs ───
    getJobs: async (applied = null) => {
        let url = `${API_BASE}/jobs/`;
        if (applied !== null) url += `?applied=${applied}`;
        const res = await fetch(url, { headers: authHeaders() });
        if (res.status === 401) throw new Error("UNAUTHORIZED");
        if (!res.ok) throw new Error("Failed to fetch jobs");
        return res.json();
    },

    startSearch: async (profile) => {
        const res = await fetch(`${API_BASE}/search/start`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(profile),
        });
        if (res.status === 401) throw new Error("UNAUTHORIZED");
        return res.json();
    },

    uploadCV: async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/upload-cv`, {
            method: "POST",
            headers,
            body: formData,
        });
        if (res.status === 401) throw new Error("UNAUTHORIZED");
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to upload CV");
        }
        return res.json();
    },

    updateJob: async (jobId, updates) => {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify(updates),
        });
        if (res.status === 401) throw new Error("UNAUTHORIZED");
        if (!res.ok) throw new Error("Failed to update job");
        return res.json();
    },

    getSearchStatus: async (profileId) => {
        const res = await fetch(`${API_BASE}/search/status/${profileId}`, {
            headers: authHeaders(),
        });
        if (res.status === 401) throw new Error("UNAUTHORIZED");
        if (!res.ok) throw new Error("Failed to get status");
        return res.json();
    },

    // ─── Schedule APIs ───
    getProfiles: async () => {
        const res = await fetch(`${API_BASE}/profiles/`, { headers: authHeaders() });
        if (res.status === 401) throw new Error("UNAUTHORIZED");
        if (!res.ok) throw new Error("Failed to fetch profiles");
        return res.json();
    },

    getSchedules: async () => {
        const res = await fetch(`${API_BASE}/schedules/`, { headers: authHeaders() });
        if (res.status === 401) throw new Error("UNAUTHORIZED");
        if (!res.ok) throw new Error("Failed to fetch schedules");
        return res.json();
    },

    toggleSchedule: async (profileId, enabled, intervalHours = null) => {
        const body = { enabled };
        if (intervalHours !== null) body.interval_hours = intervalHours;
        const res = await fetch(`${API_BASE}/profiles/${profileId}/schedule`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify(body),
        });
        if (res.status === 401) throw new Error("UNAUTHORIZED");
        if (!res.ok) throw new Error("Failed to toggle schedule");
        return res.json();
    },

    deleteProfile: async (profileId) => {
        const res = await fetch(`${API_BASE}/profiles/${profileId}`, {
            method: "DELETE",
            headers: authHeaders(),
        });
        if (res.status === 401) throw new Error("UNAUTHORIZED");
        if (!res.ok) throw new Error("Failed to delete profile");
        return res.json();
    },

    getSchedulerStatus: async () => {
        const res = await fetch(`${API_BASE}/schedules/status`, { headers: authHeaders() });
        if (res.status === 401) throw new Error("UNAUTHORIZED");
        if (!res.ok) throw new Error("Failed to get scheduler status");
        return res.json();
    },
};
