export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export class ApiClient {
    static getToken() {
        return localStorage.getItem("jh_token");
    }

    static getHeaders() {
        const token = this.getToken();
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return headers;
    }

    static async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
        };

        const response = await fetch(url, config);

        if (response.status === 401) {
            window.dispatchEvent(new Event("jh_unauthorized"));
            throw new Error("UNAUTHORIZED");
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errMsg = "API Request Failed";
            if (errorData.detail) {
                if (typeof errorData.detail === 'string') errMsg = errorData.detail;
                else if (Array.isArray(errorData.detail)) errMsg = errorData.detail.map(e => e.msg).join(", ");
                else errMsg = JSON.stringify(errorData.detail);
            } else if (errorData.message) {
                errMsg = errorData.message;
            }
            throw new Error(errMsg);
        }

        return response.json();
    }

    static async get(endpoint) {
        return this.request(endpoint, { method: "GET" });
    }

    static async post(endpoint, body) {
        return this.request(endpoint, {
            method: "POST",
            body: JSON.stringify(body),
        });
    }

    static async postForm(endpoint, body) {
        const formData = new URLSearchParams();
        for (const key in body) {
            formData.append(key, body[key]);
        }
        return this.request(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData,
        });
    }

    static async patch(endpoint, body) {
        return this.request(endpoint, {
            method: "PATCH",
            body: JSON.stringify(body),
        });
    }

    static async delete(endpoint) {
        return this.request(endpoint, { method: "DELETE" });
    }
}
