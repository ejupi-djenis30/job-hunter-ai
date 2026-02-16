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
        <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden">

            {/* Ambient Background Elements */}
            <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: -1 }}>
                <div className="position-absolute bg-primary rounded-circle opacity-20 blur-3xl"
                    style={{ top: '20%', left: '30%', width: '400px', height: '400px', filter: 'blur(100px)' }}></div>
                <div className="position-absolute bg-secondary rounded-circle opacity-10 blur-3xl"
                    style={{ top: '60%', right: '20%', width: '300px', height: '300px', filter: 'blur(100px)' }}></div>
            </div>

            <div className="glass-card shadow-2xl p-4 p-md-5 animate-scale-in position-relative" style={{ width: "100%", maxWidth: 400 }}>
                <div className="text-center mb-5">
                    <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle mb-4 text-primary" style={{ width: 72, height: 72 }}>
                        <i className="bi bi-crosshair fs-1"></i>
                    </div>
                    <h2 className="fw-bold text-white mb-2 tracking-tight">
                        JobHunter
                    </h2>
                    <p className="text-secondary opacity-75 small">
                        {mode === "login" ? "Welcome back" : "Create your account"}
                    </p>
                </div>

                {error && (
                    <div className="p-3 mb-4 rounded-3 bg-danger bg-opacity-10 text-danger border border-danger border-opacity-10 text-center small animate-shake">
                        <i className="bi bi-exclamation-circle-fill me-2"></i>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="form-label">Username</label>
                        <div className="position-relative">
                            <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-secondary opacity-50">
                                <i className="bi bi-person"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus
                                placeholder="Username"
                                style={{ paddingLeft: '2.5rem' }}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label">Password</label>
                        <div className="position-relative">
                            <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-secondary opacity-50">
                                <i className="bi bi-lock"></i>
                            </span>
                            <input
                                type="password"
                                className="form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Password"
                                style={{ paddingLeft: '2.5rem' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100 py-3 fw-bold shadow-lg rounded-pill"
                        disabled={loading || !username || !password}
                    >
                        {loading ? (
                            <span className="spinner-border spinner-border-sm me-2" />
                        ) : null}
                        {mode === "login" ? (
                            <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>
                        ) : (
                            <><i className="bi bi-rocket-takeoff me-2"></i>Sign Up</>
                        )}
                    </button>
                </form>

                <div className="text-center pt-4 mt-2">
                    <button
                        className="btn btn-link text-secondary text-decoration-none small opacity-75 hover-opacity-100"
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
    );
}
