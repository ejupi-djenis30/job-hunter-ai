import { createClient } from '@supabase/supabase-js';

const API_BASE = "http://localhost:8000";
let supabase = null;
let authConfig = { provider: 'simple' };

// ─── Init ───
export async function initAuth() {
    try {
        const res = await fetch(`${API_BASE}/auth/config`);
        authConfig = await res.json();
        if (authConfig.provider === 'supabase' && authConfig.supabase_url && authConfig.supabase_key) {
            supabase = createClient(authConfig.supabase_url, authConfig.supabase_key);
            console.log("Supabase client initialized");
        }
    } catch (e) {
        console.error("Failed to fetch auth config", e);
    }
}


// ─── Token Management ───
function getToken() {
    if (authConfig.provider === 'supabase' && supabase) {
        // We might not need to store it manually if using supabaseclient, 
        // but for compatibility with our API calls, we need the access token.
        // Supabase client manages session in local storage automatically.
        const session = JSON.parse(localStorage.getItem(`sb-${new URL(authConfig.supabase_url).hostname.split('.')[0]}-auth-token`));
        // Fallback or just return what we have if we saved it manually
        return localStorage.getItem("jh_token");
    }
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
    // ─── Auth ───
    init: initAuth,
    register: async (username, password) => {
        if (authConfig.provider === 'supabase' && supabase) {
            // Supabase requires email
            const { data, error } = await supabase.auth.signUp({
                email: username, // Assuming username is email
                password: password,
            });
            if (error) throw error;
            // Map to our expected response format
            if (data.session) {
                localStorage.setItem("jh_token", data.session.access_token);
                localStorage.setItem("jh_username", data.user.email);
            }
            return { username: data.user.email }; // Supabase might verify email first
        }
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
        if (authConfig.provider === 'supabase' && supabase) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: username,
                password: password,
            });
            if (error) throw error;
            localStorage.setItem("jh_token", data.session.access_token);
            localStorage.setItem("jh_username", data.user.email);
            return { username: data.user.email, access_token: data.session.access_token };
        }
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

    logout: async () => {
        if (authConfig.provider === 'supabase' && supabase) {
            await supabase.auth.signOut();
        }
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
