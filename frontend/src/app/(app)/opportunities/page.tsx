"use client";

import { useEffect, useState, useCallback } from "react";
import { dashboardApi, analysisApi } from "@/lib/api";
import { Zap, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function OpportunitiesPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const res = await dashboardApi.topUrgent(100);
            setCustomers(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleBulk = async () => {
        setLoading(true);
        try {
            await analysisApi.runBulk();
            loadData();
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <>
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">Opportunities</h1>
                    <p className="page-subtitle">Ranked upgrade opportunities by score</p>
                </div>
                <button className="btn btn-primary" onClick={handleBulk} disabled={loading}>
                    <Zap size={16} /> Run Bulk Analysis
                </button>
            </div>

            <div className="page-body">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th><th>Code</th><th>Customer</th><th>City</th>
                                <th>PV kW</th><th>Battery kWh</th>
                                <th>Overall</th><th>PV</th><th>Battery</th><th>Panel</th><th>GL</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((c: any, i) => (
                                <tr key={c.customer_id}>
                                    <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>{i + 1}</td>
                                    <td style={{ fontWeight: 600, color: "var(--accent-blue-light)" }}>{c.customer_code}</td>
                                    <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{c.customer_name}</td>
                                    <td>{c.city || "—"}</td>
                                    <td>{c.pv_kw ?? "—"}</td>
                                    <td>{c.battery_kwh ?? "—"}</td>
                                    <td>
                                        <span className={`badge ${c.overall_score >= 60 ? "badge-red" : c.overall_score >= 40 ? "badge-orange" : "badge-green"}`}>
                                            {c.overall_score.toFixed(0)}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 13 }}>{c.pv_score?.toFixed(0) ?? "—"}</td>
                                    <td style={{ fontSize: 13 }}>{c.battery_score?.toFixed(0) ?? "—"}</td>
                                    <td style={{ fontSize: 13 }}>{c.panel_score?.toFixed(0) ?? "—"}</td>
                                    <td style={{ fontSize: 13 }}>{c.gl_score?.toFixed(0) ?? "—"}</td>
                                    <td>
                                        <Link href={`/customers/${c.customer_id}`} className="btn btn-sm btn-secondary">View</Link>
                                    </td>
                                </tr>
                            ))}
                            {customers.length === 0 && !loading && (
                                <tr><td colSpan={12} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                                    Run Bulk Analysis to generate scores
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
