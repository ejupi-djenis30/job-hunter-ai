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
        <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden"
            style={{
                background: "radial-gradient(circle at 50% 10%, #2c3e50 0%, #000000 100%)",
            }}>

            {/* Animated Background Elements */}
            <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0 }}>
                <div className="position-absolute bg-primary rounded-circle opacity-10 blur-3xl animate-blob"
                    style={{ top: '20%', left: '30%', width: '400px', height: '400px', filter: 'blur(80px)' }}></div>
                <div className="position-absolute bg-secondary rounded-circle opacity-10 blur-3xl animate-blob animation-delay-2000"
                    style={{ top: '60%', right: '20%', width: '300px', height: '300px', filter: 'blur(80px)' }}></div>
            </div>

            <div className="glass-card shadow-lg p-1 animate-scale-in position-relative" style={{ width: "100%", maxWidth: 420, zIndex: 1 }}>
                <div className="card-body p-4 p-md-5">
                    {/* Logo */}
                    <div className="text-center mb-5">
                        <div className="d-inline-flex align-items-center justify-content-center bg-dark bg-opacity-50 rounded-circle mb-3 border border-secondary border-opacity-25" style={{ width: 64, height: 64 }}>
                            <i className="bi bi-crosshair fs-2 text-primary"></i>
                        </div>
                        <h2 className="fw-bold text-light mb-1 tracking-tight">
                            JobHunter<span className="text-primary">.ai</span>
                        </h2>
                        <p className="text-secondary opacity-75 small mb-0">
                            {mode === "login" ? "Welcome back, Hunter" : "Join the Hunt"}
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="alert alert-danger py-2 small d-flex align-items-center bg-danger bg-opacity-10 text-danger border-danger border-opacity-25 animate-shake">
                            <i className="bi bi-exclamation-circle-fill me-2"></i>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="form-label text-secondary small text-uppercase tracking-wider fw-bold">Username</label>
                            <div className="input-group">
                                <span className="input-group-text bg-dark bg-opacity-50 border-secondary border-opacity-25 text-secondary">
                                    <i className="bi bi-person"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control bg-dark bg-opacity-50 text-light border-secondary border-opacity-25 py-2"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoFocus
                                    placeholder="Enter your username"
                                    style={{ backdropFilter: 'blur(5px)' }}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label text-secondary small text-uppercase tracking-wider fw-bold">Password</label>
                            <div className="input-group">
                                <span className="input-group-text bg-dark bg-opacity-50 border-secondary border-opacity-25 text-secondary">
                                    <i className="bi bi-lock"></i>
                                </span>
                                <input
                                    type="password"
                                    className="form-control bg-dark bg-opacity-50 text-light border-secondary border-opacity-25 py-2"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter your password"
                                    style={{ backdropFilter: 'blur(5px)' }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 mb-4 py-3 fw-bold shadow-lg rounded-3 position-relative overflow-hidden group"
                            disabled={loading || !username || !password}
                            style={{ transition: 'all 0.3s ease' }}
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm me-2" />
                            ) : null}
                            {mode === "login" ? (
                                <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>
                            ) : (
                                <><i className="bi bi-rocket-takeoff me-2"></i>Create Account</>
                            )}
                        </button>
                    </form>

                    {/* Toggle mode */}
                    <div className="text-center pt-2 border-top border-secondary border-opacity-25">
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
        </div>
    );
}
