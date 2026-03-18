"use client";

import { useState } from "react";
import { importsApi } from "@/lib/api";
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError("");
        setResult(null);
        try {
            const res = await importsApi.upload(file);
            setResult(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">CSV Import</h1>
                <p className="page-subtitle">Upload customer data from CSV files</p>
            </div>

            <div className="page-body">
                <div className="card" style={{ maxWidth: 700 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Upload CSV</h3>

                    <div
                        className="upload-zone"
                        onClick={() => document.getElementById("csv-input")?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const f = e.dataTransfer.files[0];
                            if (f?.name.endsWith(".csv")) setFile(f);
                        }}
                    >
                        <Upload size={36} style={{ color: "var(--accent-blue)", marginBottom: 12 }} />
                        <div style={{ fontSize: 15, fontWeight: 600 }}>
                            {file ? file.name : "Click or drag CSV file here"}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
                            Supports: .csv files
                        </div>
                        <input
                            id="csv-input" type="file" accept=".csv" style={{ display: "none" }}
                            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                        />
                    </div>

                    <button
                        className="btn btn-primary" onClick={handleUpload}
                        disabled={!file || uploading}
                        style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
                    >
                        <Upload size={16} /> {uploading ? "Uploading..." : "Upload & Process"}
                    </button>

                    {error && (
                        <div style={{ marginTop: 16, padding: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", color: "var(--accent-red)", fontSize: 13 }}>
                            <AlertCircle size={14} style={{ display: "inline", marginRight: 6 }} /> {error}
                        </div>
                    )}

                    {result && (
                        <div style={{ marginTop: 16, padding: 16, background: "var(--bg-input)", borderRadius: "var(--radius-sm)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <CheckCircle size={20} style={{ color: "var(--accent-green)" }} />
                                <span style={{ fontWeight: 600 }}>Import Complete</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                                <div><div style={{ fontSize: 24, fontWeight: 700 }}>{result.total_rows}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Total Rows</div></div>
                                <div><div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent-green)" }}>{result.success_rows}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Success</div></div>
                                <div><div style={{ fontSize: 24, fontWeight: 700, color: result.failed_rows > 0 ? "var(--accent-red)" : "var(--text-primary)" }}>{result.failed_rows}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Failed</div></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="card" style={{ maxWidth: 700, marginTop: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                        <FileSpreadsheet size={18} style={{ display: "inline", marginRight: 8, verticalAlign: "text-bottom" }} />
                        Required CSV Format
                    </h3>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                        <div style={{ padding: 12, background: "var(--bg-input)", borderRadius: "var(--radius-sm)", fontFamily: "monospace", fontSize: 12, overflowX: "auto" }}>
                            customer_code, customer_name, phone, pv_kw, battery_kwh, panel_wattage, install_year, monthly_consumption_1, ..., monthly_consumption_12, gl_expiry_date, city, hybrid_flag
                        </div>
                        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                            <li><strong>customer_code</strong> — Unique identifier (required)</li>
                            <li><strong>customer_name</strong> — Full name (required)</li>
                            <li><strong>monthly_consumption_1..12</strong> — 12 columns, or single <code>monthly_consumption</code> as comma-separated</li>
                            <li><strong>gl_expiry_date</strong> — Format: YYYY-MM-DD</li>
                            <li>Existing customer codes will be updated</li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
