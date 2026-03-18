"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await authApi.login(email, password);
            const { access_token, user } = res.data;
            localStorage.setItem("token", access_token);
            localStorage.setItem("user", JSON.stringify(user));
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="sidebar-logo" style={{ justifyContent: "center", marginBottom: 24 }}>
                    <div className="sidebar-logo-icon" style={{ width: 48, height: 48, fontSize: 24 }}>⚡</div>
                </div>
                <h1 className="login-title">AI Upgrade</h1>
                <p className="login-subtitle">Intelligence Platform for Solar Upgrades</p>

                <form onSubmit={handleLogin}>
                    {error && (
                        <div style={{
                            background: "rgba(239,68,68,0.1)", color: "var(--accent-red)",
                            padding: "10px 14px", borderRadius: "var(--radius-sm)",
                            fontSize: 13, marginBottom: 16, border: "1px solid rgba(239,68,68,0.2)",
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email" className="form-input" placeholder="admin@skyelectric.com"
                            value={email} onChange={(e) => setEmail(e.target.value)} required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password" className="form-input" placeholder="••••••••"
                            value={password} onChange={(e) => setPassword(e.target.value)} required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}
                        style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
                    Demo: admin@skyelectric.com / password123
                </div>
            </div>
        </div>
    );
}
