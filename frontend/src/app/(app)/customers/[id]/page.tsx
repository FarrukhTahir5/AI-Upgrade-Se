"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { customersApi, analysisApi, messagesApi } from "@/lib/api";
import { Zap, MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
    const cl = value >= 60 ? "high" : value >= 40 ? "medium" : "low";
    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{value.toFixed(0)}</span>
            </div>
            <div className="score-bar-bg"><div className={`score-bar-fill ${cl}`} style={{ width: `${value}%` }} /></div>
        </div>
    );
}

export default function CustomerDetailPage() {
    const params = useParams();
    const id = Number(params.id);
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [msgType, setMsgType] = useState("whatsapp");
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadCustomer();
        loadMessages();
    }, [id]);

    const loadCustomer = async () => {
        try {
            const res = await customersApi.get(id);
            setCustomer(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const loadMessages = async () => {
        try {
            const res = await messagesApi.list(id);
            setMessages(res.data);
        } catch (err) { console.error(err); }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            await analysisApi.runSingle(id);
            await analysisApi.recommend(id);
            loadCustomer();
        } catch (err) { console.error(err); }
        finally { setAnalyzing(false); }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await messagesApi.generate(id, { message_type: msgType });
            loadMessages();
        } catch (err) { console.error(err); }
        finally { setGenerating(false); }
    };

    if (loading) return <div className="page-body" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
    if (!customer) return <div className="page-body" style={{ padding: 40, textAlign: "center" }}>Customer not found</div>;

    const score = customer.opportunity_score;
    const recs = customer.recommendations || [];

    return (
        <>
            <div className="page-header">
                <Link href="/customers" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", textDecoration: "none", fontSize: 13, marginBottom: 8 }}>
                    <ArrowLeft size={14} /> Back to Customers
                </Link>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 className="page-title">{customer.customer_name}</h1>
                        <p className="page-subtitle">{customer.customer_code} · {customer.city || "N/A"} · {customer.phone || "N/A"}</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing}>
                        <Zap size={16} /> {analyzing ? "Analyzing..." : "Run Analysis"}
                    </button>
                </div>
            </div>

            <div className="page-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    {/* System Info */}
                    <div className="card">
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>System Info</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            {[
                                ["PV Capacity", `${customer.pv_kw ?? "—"} kW`],
                                ["Battery", `${customer.battery_kwh ?? "—"} kWh`],
                                ["Panel Wattage", `${customer.panel_wattage ?? "—"} W`],
                                ["Install Year", customer.install_year ?? "—"],
                                ["Type", customer.hybrid_flag ? "Hybrid" : "Grid-Tied"],
                                ["GL Expiry", customer.gl_expiry_date || "—"],
                                ["Status", customer.service_status || "—"],
                            ].map(([label, val]) => (
                                <div key={label as string}>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</div>
                                    <div style={{ fontSize: 15, fontWeight: 600 }}>{val}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Opportunity Scores */}
                    <div className="card">
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Opportunity Scores</h3>
                        {score ? (
                            <>
                                <div style={{ textAlign: "center", marginBottom: 16 }}>
                                    <div style={{ fontSize: 42, fontWeight: 800, color: score.overall_opportunity_score >= 60 ? "var(--accent-red)" : score.overall_opportunity_score >= 40 ? "var(--accent-orange)" : "var(--accent-green)" }}>
                                        {score.overall_opportunity_score.toFixed(0)}
                                    </div>
                                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Overall Score</div>
                                </div>
                                <ScoreBar label="PV Upsize" value={score.pv_upsize_score} color="blue" />
                                <ScoreBar label="Battery Expansion" value={score.battery_expansion_score} color="purple" />
                                <ScoreBar label="Panel Modernization" value={score.panel_modernization_score} color="cyan" />
                                <ScoreBar label="GL Urgency" value={score.gl_urgency_score} color="orange" />
                            </>
                        ) : (
                            <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>
                                Click "Run Analysis" to generate scores
                            </div>
                        )}
                    </div>

                    {/* Recommendations */}
                    <div className="card">
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recommendations</h3>
                        {recs.length > 0 ? recs.map((r: any) => (
                            <div key={r.id} style={{
                                padding: 14, background: "var(--bg-input)", borderRadius: "var(--radius-sm)", marginBottom: 10,
                                border: `1px solid ${r.priority_level === "critical" ? "rgba(239,68,68,0.3)" : r.priority_level === "high" ? "rgba(245,158,11,0.3)" : "var(--border-color)"}`,
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span className={`badge ${r.priority_level === "critical" ? "badge-red" : r.priority_level === "high" ? "badge-orange" : "badge-blue"}`}>
                                        {r.priority_level}
                                    </span>
                                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.recommendation_type?.replace("_", " ")}</span>
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 500 }}>{r.recommendation_summary}</div>
                                {r.detailed_reasoning && (
                                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>{r.detailed_reasoning}</div>
                                )}
                            </div>
                        )) : (
                            <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>
                                Run analysis to get recommendations
                            </div>
                        )}
                    </div>

                    {/* Message Generator */}
                    <div className="card">
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>AI Message Generator</h3>
                        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                            {["whatsapp", "sms", "email", "call_script"].map((t) => (
                                <button key={t} className={`btn btn-sm ${msgType === t ? "btn-primary" : "btn-secondary"}`}
                                    onClick={() => setMsgType(t)} style={{ textTransform: "capitalize" }}
                                >
                                    {t.replace("_", " ")}
                                </button>
                            ))}
                        </div>
                        <button className="btn btn-success" onClick={handleGenerate} disabled={generating} style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}>
                            <MessageSquare size={16} /> {generating ? "Generating..." : "Generate Message"}
                        </button>

                        {messages.length > 0 && (
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>Recent Messages</div>
                                {messages.slice(0, 3).map((m: any) => (
                                    <div key={m.id} style={{
                                        padding: 12, background: "var(--bg-input)", borderRadius: "var(--radius-sm)",
                                        marginBottom: 8, fontSize: 13,
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                            <span className="badge badge-blue" style={{ textTransform: "capitalize" }}>{m.message_type}</span>
                                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(m.created_at).toLocaleString()}</span>
                                        </div>
                                        <div style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>{m.generated_message}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Monthly Consumption Chart */}
                    <div className="card" style={{ gridColumn: "1 / -1" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Monthly Consumption (Last 12 Months)</h3>
                        {customer.monthly_consumption?.length > 0 ? (
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160 }}>
                                {customer.monthly_consumption.map((val: number, i: number) => {
                                    const max = Math.max(...customer.monthly_consumption);
                                    const height = max > 0 ? (val / max) * 140 : 0;
                                    return (
                                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>{Math.round(val)}</div>
                                            <div style={{
                                                height, width: "100%", borderRadius: "4px 4px 0 0",
                                                background: "linear-gradient(180deg, #3b82f6, #8b5cf6)",
                                                minHeight: 4,
                                            }} />
                                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>M{i + 1}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>No consumption data</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
