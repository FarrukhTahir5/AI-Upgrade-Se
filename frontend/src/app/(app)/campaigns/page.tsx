"use client";

import { useEffect, useState } from "react";
import { campaignsApi } from "@/lib/api";
import { Target } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
    not_contacted: "badge-blue",
    contacted: "badge-purple",
    interested: "badge-orange",
    quote_sent: "badge-cyan",
    converted: "badge-green",
    not_interested: "badge-red",
};

const ALL_STATUSES = ["not_contacted", "contacted", "interested", "quote_sent", "converted", "not_interested"];

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => { loadCampaigns(); }, [page, statusFilter]);

    const loadCampaigns = async () => {
        try {
            const params: any = { page, page_size: 20 };
            if (statusFilter) params.status = statusFilter;
            const res = await campaignsApi.list(params);
            setCampaigns(res.data.items || []);
            setTotal(res.data.total || 0);
        } catch (err) { console.error(err); }
    };

    const updateStatus = async (id: number, newStatus: string) => {
        try {
            await campaignsApi.updateStatus(id, newStatus);
            loadCampaigns();
        } catch (err) { console.error(err); }
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Campaigns</h1>
                <p className="page-subtitle">{total} campaigns tracked</p>
            </div>

            <div className="page-body">
                <div className="search-bar">
                    <select
                        className="form-input" style={{ width: 200 }}
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Statuses</option>
                        {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                        ))}
                    </select>
                </div>

                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th><th>Customer</th><th>Channel</th>
                                <th>Status</th><th>Last Contact</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map((c: any) => (
                                <tr key={c.id}>
                                    <td>{c.id}</td>
                                    <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>Customer #{c.customer_id}</td>
                                    <td>{c.channel || "—"}</td>
                                    <td>
                                        <span className={`badge ${STATUS_COLORS[c.campaign_status] || "badge-blue"}`} style={{ textTransform: "capitalize" }}>
                                            {c.campaign_status?.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                        {c.last_contact_at ? new Date(c.last_contact_at).toLocaleDateString() : "—"}
                                    </td>
                                    <td>
                                        <select
                                            className="form-input" style={{ width: 160, padding: "6px 10px", fontSize: 12 }}
                                            value={c.campaign_status}
                                            onChange={(e) => updateStatus(c.id, e.target.value)}
                                        >
                                            {ALL_STATUSES.map((s) => (
                                                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            {campaigns.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No campaigns yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
