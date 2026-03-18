"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, Users, Upload, Zap, MessageSquare,
    Target, Settings, LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const navItems = [
    {
        section: "Overview", items: [
            { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ]
    },
    {
        section: "Data", items: [
            { label: "Customers", href: "/customers", icon: Users },
            { label: "CSV Import", href: "/import", icon: Upload },
        ]
    },
    {
        section: "Intelligence", items: [
            { label: "Opportunities", href: "/opportunities", icon: Zap },
            { label: "Campaigns", href: "/campaigns", icon: Target },
        ]
    },
    {
        section: "System", items: [
            { label: "Messages", href: "/messages", icon: MessageSquare },
            { label: "Settings", href: "/settings", icon: Settings },
        ]
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">⚡</div>
                    <span className="sidebar-logo-text">AI Upgrade</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((section) => (
                    <div key={section.section}>
                        <div className="nav-section-label">{section.section}</div>
                        {section.items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-link ${pathname === item.href || (item.href === "/dashboard" && pathname === "/") ? "active" : ""}`}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>

            <div style={{ padding: "16px 12px", borderTop: "1px solid var(--border-color)" }}>
                <div style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-card)",
                    marginBottom: "8px",
                }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {user?.full_name || "User"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" }}>
                        {user?.role || "user"}
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="nav-link"
                    style={{ width: "100%", border: "none", background: "none", cursor: "pointer" }}
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </div>
    );
}
