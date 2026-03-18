"use client";

import { useEffect, useState, useCallback } from "react";
import { customersApi } from "@/lib/api";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [cityFilter, setCityFilter] = useState("");
    const [hybridFilter, setHybridFilter] = useState<string>("");

    const loadCustomers = useCallback(async () => {
        try {
            const params: any = { page, page_size: 20 };
            if (search) params.search = search;
            if (cityFilter) params.city = cityFilter;
            if (hybridFilter !== "") params.hybrid = hybridFilter === "true";
            const res = await customersApi.list(params);
            setCustomers(res.data.items);
            setTotal(res.data.total);
            setTotalPages(res.data.total_pages);
        } catch (err) {
            console.error(err);
        }
    }, [page, search, cityFilter, hybridFilter]);

    useEffect(() => { loadCustomers(); }, [loadCustomers]);

    return (
        <>
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">Customers</h1>
                    <p className="page-subtitle">{total.toLocaleString()} customers in database</p>
                </div>
                <Link href="/customers/new" className="btn btn-primary"><Plus size={16} /> Add Customer</Link>
            </div>

            <div className="page-body">
                {/* Search & Filters */}
                <div className="search-bar">
                    <div className="search-input-wrapper" style={{ flex: 1 }}>
                        <Search size={16} />
                        <input
                            className="form-input" placeholder="Search by name, code, or phone..."
                            style={{ paddingLeft: 40 }}
                            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <input
                        className="form-input" placeholder="Filter by city" style={{ width: 160 }}
                        value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
                    />
                    <select
                        className="form-input" style={{ width: 140 }}
                        value={hybridFilter} onChange={(e) => { setHybridFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Types</option>
                        <option value="true">Hybrid</option>
                        <option value="false">Non-Hybrid</option>
                    </select>
                </div>

                {/* Table */}
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Code</th><th>Customer Name</th><th>City</th>
                                <th>PV (kW)</th><th>Battery (kWh)</th><th>Panel (W)</th>
                                <th>Install Year</th><th>GL Expiry</th><th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((c) => (
                                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => window.location.href = `/customers/${c.id}`}>
                                    <td style={{ fontWeight: 600, color: "var(--accent-blue-light)" }}>{c.customer_code}</td>
                                    <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{c.customer_name}</td>
                                    <td>{c.city || "—"}</td>
                                    <td>{c.pv_kw ?? "—"}</td>
                                    <td>{c.battery_kwh ?? "—"}</td>
                                    <td>{c.panel_wattage ?? "—"}</td>
                                    <td>{c.install_year ?? "—"}</td>
                                    <td>{c.gl_expiry_date || "—"}</td>
                                    <td>
                                        <span className={`badge ${c.hybrid_flag ? "badge-purple" : "badge-blue"}`}>
                                            {c.hybrid_flag ? "Hybrid" : "Grid-Tied"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No customers found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="pagination">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                        <ChevronLeft size={14} />
                    </button>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        Page {page} of {totalPages}
                    </span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </>
    );
}
