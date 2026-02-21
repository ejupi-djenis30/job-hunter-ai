/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(AuthService.getUsername());

    function logout() {
        AuthService.logout();
        setUser(null);
    }

    useEffect(() => {
        const handleUnauthorized = () => {
            console.warn("Session expired or unauthorized. Logging out.");
            logout();
        };

        window.addEventListener("jh_unauthorized", handleUnauthorized);
        return () => window.removeEventListener("jh_unauthorized", handleUnauthorized);
    }, []);

    const login = async (username, password) => {
        const res = await AuthService.login(username, password);
        if (res.access_token) {
            setUser(username);
        }
        return res;
    };

    const register = async (username, password) => {
        const res = await AuthService.register(username, password);
        if (res.access_token) {
            setUser(username);
        }
        return res;
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoggedIn: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
