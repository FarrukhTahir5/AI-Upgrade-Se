"use client";

import { useEffect, useState } from "react";
import { dashboardApi, analysisApi } from "@/lib/api";
import {
    Users, Zap, Battery, AlertTriangle, Target, TrendingUp,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [glByYear, setGlByYear] = useState<any[]>([]);
    const [oppByType, setOppByType] = useState<any[]>([]);
    const [funnel, setFunnel] = useState<any[]>([]);
    const [topUrgent, setTopUrgent] = useState<any[]>([]);
    const [bulkRunning, setBulkRunning] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const [s, g, o, f, t] = await Promise.all([
                dashboardApi.stats(),
                dashboardApi.glExpiryByYear(),
                dashboardApi.opportunitiesByType(),
                dashboardApi.campaignFunnel(),
                dashboardApi.topUrgent(10),
            ]);
            setStats(s.data);
            setGlByYear(g.data);
            setOppByType(o.data);
            setFunnel(f.data);
            setTopUrgent(t.data);
        } catch (err) {
            console.error("Dashboard load error:", err);
        }
    };

    const handleBulkAnalysis = async () => {
        setBulkRunning(true);
        try {
            await analysisApi.runBulk();
            loadDashboard();
        } catch (err) {
            console.error(err);
        } finally {
            setBulkRunning(false);
        }
    };

    const statCards = stats ? [
        { label: "Total Customers", value: stats.total_customers, icon: Users, color: "blue" },
        { label: "Hybrid Systems", value: stats.total_hybrid_customers, icon: Battery, color: "purple" },
        { label: "GL Expiring (This Year)", value: stats.gl_expiring_this_year, icon: AlertTriangle, color: "orange" },
        { label: "Legacy Panels", value: stats.legacy_panel_customers, icon: Zap, color: "cyan" },
        { label: "High Priority", value: stats.high_priority_candidates, icon: TrendingUp, color: "red" },
        { label: "Conversions", value: stats.campaign_conversions, icon: Target, color: "green" },
    ] : [];

    return (
        <>
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">AI Upgrade Intelligence Overview</p>
                </div>
                <button className="btn btn-primary" onClick={handleBulkAnalysis} disabled={bulkRunning}>
                    <Zap size={16} />
                    {bulkRunning ? "Analyzing..." : "Run Bulk Analysis"}
                </button>
            </div>

            <div className="page-body">
                {/* Stats cards */}
                <div className="stats-grid">
                    {statCards.map((s) => (
                        <div key={s.label} className={`card stat-card ${s.color}`}>
                            <div className={`stat-icon ${s.color}`}><s.icon size={20} /></div>
                            <div className="stat-value">{s.value?.toLocaleString()}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Charts */}
                <div className="chart-grid">
                    {/* GL Expiry by Year */}
                    <div className="card">
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>GL Expiry Timeline</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={glByYear}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 8 }}
                                    labelStyle={{ color: "var(--text-primary)" }}
                                />
                                <Bar dataKey="count" fill="url(#blueGradient)" radius={[4, 4, 0, 0]} />
                                <defs>
                                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Opportunities by Type */}
                    <div className="card">
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Opportunities by Type</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={oppByType} dataKey="count" nameKey="type"
                                    cx="50%" cy="50%" outerRadius={100} innerRadius={50}
                                    label={(props: any) => `${String(props.type).replace("_", " ")}: ${props.count}`}
                                    labelLine={false}
                                >
                                    {oppByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 8 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Campaign Funnel */}
                    <div className="card">
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Campaign Funnel</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={funnel} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis type="category" dataKey="status" width={120} stroke="var(--text-muted)" fontSize={11} />
                                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 8 }} />
                                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top Urgent Customers */}
                    <div className="card">
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Top Urgent Customers</h3>
                        <div className="table-wrapper" style={{ maxHeight: 280, overflowY: "auto" }}>
                            <table>
                                <thead>
                                    <tr><th>Customer</th><th>City</th><th>Score</th></tr>
                                </thead>
                                <tbody>
                                    {topUrgent.map((c: any) => (
                                        <tr key={c.customer_id}>
                                            <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{c.customer_name}</td>
                                            <td>{c.city}</td>
                                            <td>
                                                <span className={`badge ${c.overall_score >= 60 ? "badge-red" : c.overall_score >= 40 ? "badge-orange" : "badge-green"}`}>
                                                    {c.overall_score.toFixed(0)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {topUrgent.length === 0 && (
                                        <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--text-muted)" }}>Run Bulk Analysis to see results</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
