"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { customersApi } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NewCustomerPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        customer_code: "",
        customer_name: "",
        phone: "",
        email: "",
        city: "",
        pv_kw: "",
        battery_kwh: "",
        panel_wattage: "",
        install_year: "",
        hybrid_flag: false,
        gl_expiry_date: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const data: any = {
                customer_code: form.customer_code,
                customer_name: form.customer_name,
                phone: form.phone || undefined,
                email: form.email || undefined,
                city: form.city || undefined,
                pv_kw: form.pv_kw ? parseFloat(form.pv_kw) : undefined,
                battery_kwh: form.battery_kwh ? parseFloat(form.battery_kwh) : undefined,
                panel_wattage: form.panel_wattage ? parseInt(form.panel_wattage) : undefined,
                install_year: form.install_year ? parseInt(form.install_year) : undefined,
                hybrid_flag: form.hybrid_flag,
                gl_expiry_date: form.gl_expiry_date || undefined,
            };
            const res = await customersApi.create(data);
            router.push(`/customers/${res.data.id}`);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to create customer");
        } finally {
            setSaving(false);
        }
    };

    const update = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

    return (
        <>
            <div className="page-header">
                <Link href="/customers" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", textDecoration: "none", fontSize: 13, marginBottom: 8 }}>
                    <ArrowLeft size={14} /> Back to Customers
                </Link>
                <h1 className="page-title">Add Customer</h1>
            </div>

            <div className="page-body" style={{ maxWidth: 600 }}>
                <div className="card">
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div style={{ background: "rgba(239,68,68,0.1)", padding: "10px 14px", borderRadius: "var(--radius-sm)", color: "var(--accent-red)", fontSize: 13, marginBottom: 16, border: "1px solid rgba(239,68,68,0.2)" }}>
                                {error}
                            </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div className="form-group">
                                <label className="form-label">Customer Code *</label>
                                <input className="form-input" value={form.customer_code} onChange={(e) => update("customer_code", e.target.value)} required placeholder="SE-10001" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Name *</label>
                                <input className="form-input" value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} required placeholder="John Doe" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input className="form-input" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+923001234567" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@example.com" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">City</label>
                                <input className="form-input" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Lahore" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">PV (kW)</label>
                                <input className="form-input" type="number" step="0.1" value={form.pv_kw} onChange={(e) => update("pv_kw", e.target.value)} placeholder="10" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Battery (kWh)</label>
                                <input className="form-input" type="number" step="0.1" value={form.battery_kwh} onChange={(e) => update("battery_kwh", e.target.value)} placeholder="7.5" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Panel Wattage (W)</label>
                                <input className="form-input" type="number" value={form.panel_wattage} onChange={(e) => update("panel_wattage", e.target.value)} placeholder="540" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Install Year</label>
                                <input className="form-input" type="number" value={form.install_year} onChange={(e) => update("install_year", e.target.value)} placeholder="2022" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">GL Expiry Date</label>
                                <input className="form-input" type="date" value={form.gl_expiry_date} onChange={(e) => update("gl_expiry_date", e.target.value)} />
                            </div>
                        </div>

                        <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <input type="checkbox" id="hybrid" checked={form.hybrid_flag} onChange={(e) => update("hybrid_flag", e.target.checked)} />
                            <label htmlFor="hybrid" style={{ fontSize: 14, color: "var(--text-secondary)" }}>Hybrid System</label>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} disabled={saving}>
                            <Save size={16} /> {saving ? "Saving..." : "Create Customer"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
