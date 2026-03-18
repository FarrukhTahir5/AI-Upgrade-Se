"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    if (loading) {
        return (
            <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <div className="sidebar-logo-icon" style={{ width: 48, height: 48, fontSize: 24, margin: "0 auto 12px" }}>⚡</div>
                    <div style={{ color: "var(--text-secondary)" }}>Loading...</div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <>
            <Sidebar />
            <div className="main-content">{children}</div>
        </>
    );
}
