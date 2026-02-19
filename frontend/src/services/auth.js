import { ApiClient, API_BASE } from "../lib/client";

export const AuthService = {
    async login(username, password) {
        const resData = await ApiClient.postForm("/auth/login", { username, password });

        if (resData.access_token) {
            localStorage.setItem("jh_token", resData.access_token);
            localStorage.setItem("jh_username", username);
        }
        return resData;
    },

    async register(username, password) {
        const resData = await ApiClient.post("/auth/register", { username, password });
        if (resData.access_token) {
            localStorage.setItem("jh_token", resData.access_token);
            localStorage.setItem("jh_username", username);
        }
        return resData;
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
