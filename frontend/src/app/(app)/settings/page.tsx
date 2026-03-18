"use client";

import { useAuth } from "@/lib/auth";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Platform configuration</p>
            </div>

            <div className="page-body" style={{ maxWidth: 600 }}>
                <div className="card">
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                        <SettingsIcon size={18} style={{ display: "inline", marginRight: 8, verticalAlign: "text-bottom" }} />
                        User Profile
                    </h3>
                    <div style={{ display: "grid", gap: 12 }}>
                        {[
                            ["Name", user?.full_name],
                            ["Email", user?.email],
                            ["Role", user?.role],
                        ].map(([label, value]) => (
                            <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
                                <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                                <span style={{ fontWeight: 500, textTransform: "capitalize" }}>{value || "—"}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ marginTop: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>API Configuration</h3>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                        Scoring thresholds, Gemini API settings, and business rules are configured
                        via environment variables in the <code>.env</code> file. See the backend documentation for details.
                    </p>
                </div>
            </div>
        </>
    );
}
