"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { constituencyData } from "../../data/constituencyData";

interface WardCoverage {
    lga: string;
    ward: string;
    totalPUs: number;
    supporterCount: number;
}

export default function CoveragePage() {
    const [data, setData] = useState<WardCoverage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterLGA, setFilterLGA] = useState("All");

    useEffect(() => {
        async function load() {
            const coverage: WardCoverage[] = [];
            for (const lga of constituencyData) {
                for (const ward of lga.wards) {
                    const { count } = await supabase
                        .from("supporters")
                        .select("*", { count: "exact", head: true })
                        .eq("lga", lga.name)
                        .eq("ward", ward.name);
                    coverage.push({
                        lga: lga.name,
                        ward: ward.name,
                        totalPUs: ward.pollingUnits.length,
                        supporterCount: count || 0,
                    });
                }
            }
            setData(coverage);
            setLoading(false);
        }
        load();
    }, []);

    const filtered = filterLGA === "All" ? data : data.filter(d => d.lga === filterLGA);
    const coldSpots = filtered.filter(d => d.supporterCount === 0);
    const totalSupporters = filtered.reduce((s, d) => s + d.supporterCount, 0);
    const totalPUs = filtered.reduce((s, d) => s + d.totalPUs, 0);

    const card: React.CSSProperties = {
        background: "var(--admin-card)", border: "1px solid var(--admin-border)",
        borderRadius: 16, padding: 24, marginBottom: 20,
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--admin-text)" }}>Polling Unit Coverage</h1>
                    <p style={{ fontSize: 14, color: "var(--admin-text-muted)", marginTop: 4 }}>
                        Identify cold spots — wards & polling units with zero supporters
                    </p>
                </div>
                <select
                    value={filterLGA}
                    onChange={e => setFilterLGA(e.target.value)}
                    style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--admin-border)", background: "var(--admin-card)", color: "var(--admin-text)", fontSize: 13, fontWeight: 600 }}
                >
                    <option value="All">All LGAs</option>
                    {constituencyData.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
                </select>
            </div>

            {loading ? (
                <p style={{ color: "var(--admin-text-muted)", padding: 40, textAlign: "center" }}>Scanning all wards and polling units...</p>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
                        {[
                            { label: "Total Wards", value: filtered.length, color: "#1D7A50" },
                            { label: "Total PUs", value: totalPUs, color: "#C9A227" },
                            { label: "Total Supporters", value: totalSupporters, color: "#1D7A50" },
                            { label: "Cold Spots (0 supporters)", value: coldSpots.length, color: coldSpots.length > 0 ? "#e53e3e" : "#1D7A50" },
                        ].map((s, i) => (
                            <div key={i} style={{ ...card, textAlign: "center", marginBottom: 0 }}>
                                <p style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: "var(--font-heading)" }}>{s.value}</p>
                                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-muted)", marginTop: 4 }}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Cold Spots Alert */}
                    {coldSpots.length > 0 && (
                        <div style={{ ...card, background: "rgba(229,62,62,0.08)", borderColor: "rgba(229,62,62,0.2)" }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#e53e3e", marginBottom: 12 }}>
                                🔴 {coldSpots.length} Ward{coldSpots.length > 1 ? "s" : ""} with ZERO supporters — Campaign Priority!
                            </h3>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {coldSpots.map(cs => (
                                    <span key={`${cs.lga}-${cs.ward}`} style={{
                                        padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                                        background: "rgba(229,62,62,0.1)", color: "#e53e3e", border: "1px solid rgba(229,62,62,0.2)"
                                    }}>
                                        {cs.ward} ({cs.lga}) · {cs.totalPUs} PUs
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Full Table */}
                    <div style={card}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--admin-text)", marginBottom: 16 }}>Ward-by-Ward Breakdown</h3>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid var(--admin-border)" }}>
                                    {["LGA", "Ward", "Polling Units", "Supporters", "Status"].map(h => (
                                        <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontWeight: 700, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--admin-text-muted)" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((d, i) => {
                                    const status = d.supporterCount === 0
                                        ? { label: "Cold ❄️", color: "#e53e3e" }
                                        : d.supporterCount < 5
                                            ? { label: "Low", color: "#C9A227" }
                                            : { label: "Active ✅", color: "#1D7A50" };
                                    return (
                                        <tr key={i} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                                            <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--admin-text)" }}>{d.lga}</td>
                                            <td style={{ padding: "10px 12px", color: "var(--admin-text)" }}>{d.ward}</td>
                                            <td style={{ padding: "10px 12px", color: "var(--admin-text)" }}>{d.totalPUs}</td>
                                            <td style={{ padding: "10px 12px", fontWeight: 700, color: status.color }}>{d.supporterCount}</td>
                                            <td style={{ padding: "10px 12px" }}>
                                                <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: status.color + "15", color: status.color }}>{status.label}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
