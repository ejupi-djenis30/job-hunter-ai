import { ApiClient, API_BASE } from "../lib/client";

export const AuthService = {
    async login(username, password) {
        const data = await ApiClient.post("/auth/login", { username, password }); // This mimics the OAuth form data if needed, or JSON
        // Note: The backend endpoint might expect form data for OAuth2 compliance, but we implemented JSON for simpler refactor.
        // Let's verify backend implementation. Step 78 showed JSON body login implementation? 
        // No, step 78 showed: `form_data: OAuth2PasswordRequestForm = Depends()` which requires FORM DATA.

        // CORRECTION: Backend expects Form Data.
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        });

        if (!response.ok) throw new Error("Login failed");
        const resData = await response.json();

        if (resData.access_token) {
            localStorage.setItem("jh_token", resData.access_token);
            localStorage.setItem("jh_username", username);
        }
        return resData;
    },

    async register(username, password) {
        return ApiClient.post("/auth/register", { username, password });
    },

    logout() {
        localStorage.removeItem("jh_token");
        localStorage.removeItem("jh_username");
    },

    getUsername() {
        return localStorage.getItem("jh_username");
    },

    isLoggedIn() {
        return !!localStorage.getItem("jh_token");
    }
};
