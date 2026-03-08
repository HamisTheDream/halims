"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { constituencyData } from "../../data/constituencyData";

interface WardPoint {
    lga: string;
    ward: string;
    count: number;
}

export default function LiveMapPage() {
    const [wardData, setWardData] = useState<WardPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedWard, setSelectedWard] = useState<WardPoint | null>(null);
    const [filterLGA, setFilterLGA] = useState("All");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        async function load() {
            const points: WardPoint[] = [];
            for (const lga of constituencyData) {
                for (const ward of lga.wards) {
                    const { count } = await supabase
                        .from("supporters")
                        .select("*", { count: "exact", head: true })
                        .eq("lga", lga.name)
                        .eq("ward", ward.name);
                    points.push({ lga: lga.name, ward: ward.name, count: count || 0 });
                }
            }
            setWardData(points);
            setLoading(false);
        }
        load();
    }, []);

    const filtered = filterLGA === "All" ? wardData : wardData.filter(w => w.lga === filterLGA);
    const maxCount = Math.max(...wardData.map(w => w.count), 1);
    const totalSupporters = wardData.reduce((s, w) => s + w.count, 0);

    // Group by LGA
    const lgaGroups = constituencyData.map(lga => ({
        name: lga.name,
        wards: filtered.filter(w => w.lga === lga.name),
        total: filtered.filter(w => w.lga === lga.name).reduce((s, w) => s + w.count, 0),
    })).filter(g => filterLGA === "All" || g.name === filterLGA);

    const getHeatColor = (count: number) => {
        if (count === 0) return { bg: "rgba(229,62,62,0.08)", border: "rgba(229,62,62,0.15)", text: "#e53e3e" };
        const ratio = count / maxCount;
        if (ratio < 0.25) return { bg: "rgba(201,162,39,0.1)", border: "rgba(201,162,39,0.2)", text: "#C9A227" };
        if (ratio < 0.5) return { bg: "rgba(201,162,39,0.2)", border: "rgba(201,162,39,0.3)", text: "#b8941e" };
        if (ratio < 0.75) return { bg: "rgba(29,122,80,0.15)", border: "rgba(29,122,80,0.25)", text: "#1D7A50" };
        return { bg: "rgba(29,122,80,0.25)", border: "rgba(29,122,80,0.4)", text: "#0A6B3F" };
    };

    const card: React.CSSProperties = {
        background: "var(--admin-card)", border: "1px solid var(--admin-border)",
        borderRadius: 16, padding: 24, marginBottom: 20,
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--admin-text)" }}>Live Supporter Map</h1>
                    <p style={{ fontSize: 14, color: "var(--admin-text-muted)", marginTop: 4 }}>
                        Visual density map of supporters across all wards — {totalSupporters} total
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
                <p style={{ color: "var(--admin-text-muted)", padding: 60, textAlign: "center" }}>Building supporter map...</p>
            ) : (
                <>
                    {/* Legend */}
                    <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                        {[
                            { label: "Cold (0)", color: "rgba(229,62,62,0.12)" },
                            { label: "Low", color: "rgba(201,162,39,0.15)" },
                            { label: "Warm", color: "rgba(201,162,39,0.3)" },
                            { label: "Good", color: "rgba(29,122,80,0.2)" },
                            { label: "Hot 🔥", color: "rgba(29,122,80,0.35)" },
                        ].map(l => (
                            <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--admin-text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>
                                <span style={{ width: 16, height: 16, borderRadius: 4, background: l.color, display: "inline-block" }} />
                                {l.label}
                            </span>
                        ))}
                    </div>

                    {/* LGA Blocks */}
                    {lgaGroups.map(group => (
                        <div key={group.name} style={card}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--admin-text)", letterSpacing: 1, textTransform: "uppercase" }}>
                                    {group.name} · {group.wards.length} Wards
                                </h3>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#C9A227" }}>{group.total} supporters</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                                {group.wards.map(w => {
                                    const heat = getHeatColor(w.count);
                                    return (
                                        <div
                                            key={w.ward}
                                            onClick={() => setSelectedWard(selectedWard?.ward === w.ward ? null : w)}
                                            style={{
                                                padding: "14px 12px", borderRadius: 12, cursor: "pointer",
                                                background: heat.bg, border: `1px solid ${heat.border}`,
                                                textAlign: "center", transition: "all 0.2s",
                                                transform: selectedWard?.ward === w.ward ? "scale(1.05)" : "scale(1)",
                                                boxShadow: selectedWard?.ward === w.ward ? `0 4px 20px ${heat.border}` : "none",
                                            }}
                                        >
                                            <p style={{ fontSize: 10, fontWeight: 700, color: heat.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 4 }}>{w.ward}</p>
                                            <p style={{ fontSize: 24, fontWeight: 900, color: heat.text, fontFamily: "var(--font-heading)" }}>{w.count}</p>
                                            <p style={{ fontSize: 9, color: heat.text, opacity: 0.7 }}>supporters</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Selected Ward Detail */}
                    {selectedWard && (
                        <div style={{ ...card, borderColor: "#C9A227", background: "rgba(201,162,39,0.04)" }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--admin-text)" }}>
                                📍 {selectedWard.ward} — {selectedWard.lga}
                            </h3>
                            <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginTop: 8 }}>
                                {selectedWard.count} registered supporter{selectedWard.count !== 1 ? "s" : ""}
                                {" · "}
                                {constituencyData.find(l => l.name === selectedWard.lga)?.wards.find(w => w.name === selectedWard.ward)?.pollingUnits.length || 0} polling units
                            </p>
                        </div>
                    )}
                </>
            )}
            <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
    );
}
