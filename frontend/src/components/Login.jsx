import React, { useState } from "react";
import { AuthService } from "../services/auth";

export function Login({ onLogin }) {
    const [mode, setMode] = useState("login"); // login | register
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (mode === "register") {
                if (password.length < 4) {
                    setError("Password must be at least 4 characters");
                    setLoading(false);
                    return;
                }
                await AuthService.register(username, password);
            } else {
                await AuthService.login(username, password);
            }
            onLogin(username);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center"
            style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)" }}>
            <div className="card bg-dark border-secondary shadow-lg" style={{ width: "100%", maxWidth: 420 }}>
                <div className="card-body p-4">
                    {/* Logo */}
                    <div className="text-center mb-4">
                        <h2 className="fw-bold text-light mb-1 d-flex align-items-center justify-content-center">
                            <i className="bi bi-crosshair me-2 text-primary"></i>
                            JobHunter<span className="text-primary">.ai</span>
                        </h2>
                        <p className="text-secondary small mb-0">
                            {mode === "login" ? "Welcome back" : "Create your account"}
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="alert alert-danger py-2 small">{error}</div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label text-secondary small">Username</label>
                            <input
                                type="text"
                                className="form-control bg-dark text-light border-secondary"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus
                                placeholder="Enter username"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="form-label text-secondary small">Password</label>
                            <input
                                type="password"
                                className="form-control bg-dark text-light border-secondary"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 mb-3"
                            disabled={loading || !username || !password}
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm me-2" />
                            ) : null}
                            {mode === "login" ? <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</> : <><i className="bi bi-rocket-takeoff me-2"></i>Create Account</>}
                        </button>
                    </form>

                    {/* Toggle mode */}
                    <div className="text-center">
                        <button
                            className="btn btn-link text-secondary text-decoration-none small"
                            onClick={() => {
                                setMode(mode === "login" ? "register" : "login");
                                setError("");
                            }}
                        >
                            {mode === "login"
                                ? "Don't have an account? Register"
                                : "Already have an account? Sign In"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
