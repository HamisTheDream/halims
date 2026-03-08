"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { constituencyData } from "../data/constituencyData";
import styles from "./dashboard.module.css";

interface LGAStat { name: string; supporters: number; percentage: number; color: string; }
interface RecentSupporter { full_name: string; lga: string; ward: string; created_at: string; }

const LGA_COLORS: Record<string, string> = {
    "Ankpa": "#C9A227",
    "Omala": "#1D7A50",
    "Olamaboro": "#145235",
};

// Calculate actual polling unit count from constituency data
const totalPollingUnits = constituencyData.reduce(
    (sum, lga) => sum + lga.wards.reduce((ws, w) => ws + w.pollingUnits.length, 0), 0
);
const totalWards = constituencyData.reduce((sum, lga) => sum + lga.wards.length, 0);

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

interface WardHeat { ward: string; lga: string; count: number; }

export default function AdminDashboard() {
    const [totalSupporters, setTotalSupporters] = useState(0);
    const [lgaStats, setLgaStats] = useState<LGAStat[]>([]);
    const [recent, setRecent] = useState<RecentSupporter[]>([]);
    const [wardHeatmap, setWardHeatmap] = useState<WardHeat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            // Total supporters
            const { count } = await supabase
                .from("supporters")
                .select("*", { count: "exact", head: true });
            const total = count || 0;
            setTotalSupporters(total);

            // LGA breakdown
            const lgas = ["Ankpa", "Omala", "Olamaboro"];
            const lgaData: LGAStat[] = [];
            for (const lga of lgas) {
                const { count: lgaCount } = await supabase
                    .from("supporters")
                    .select("*", { count: "exact", head: true })
                    .eq("lga", lga);
                const c = lgaCount || 0;
                lgaData.push({
                    name: lga,
                    supporters: c,
                    percentage: total > 0 ? Math.round((c / total) * 100) : 0,
                    color: LGA_COLORS[lga] || "#999",
                });
            }
            setLgaStats(lgaData);

            // Recent supporters
            const { data: recentData } = await supabase
                .from("supporters")
                .select("full_name, lga, ward, created_at")
                .order("created_at", { ascending: false })
                .limit(8);
            setRecent(recentData || []);

            // Ward heatmap — get all wards from constituencyData, then count supporters per ward
            const allWards: WardHeat[] = [];
            for (const lga of constituencyData) {
                for (const ward of lga.wards) {
                    const { count: wc } = await supabase
                        .from("supporters")
                        .select("*", { count: "exact", head: true })
                        .eq("ward", ward.name);
                    allWards.push({ ward: ward.name, lga: lga.name, count: wc || 0 });
                }
            }
            setWardHeatmap(allWards);

            setLoading(false);
        }
        fetchData();
    }, []);

    const stats = [
        { label: "Total Supporters", value: totalSupporters.toLocaleString(), icon: "👥", color: "#C9A227" },
        { label: "LGAs Covered", value: constituencyData.length.toString(), icon: "📍", color: "#1D7A50" },
        { label: "Wards Mapped", value: totalWards.toString(), icon: "🗺️", color: "#E8C560" },
        { label: "Polling Units", value: totalPollingUnits.toLocaleString(), icon: "🗳️", color: "#145235" },
    ];

    // Heatmap color logic
    const maxWardCount = Math.max(...wardHeatmap.map(w => w.count), 1);
    const getHeatColor = (count: number) => {
        if (count === 0) return { bg: "rgba(120,120,120,0.12)", text: "#888", label: "Cold" };
        const ratio = count / maxWardCount;
        if (ratio < 0.25) return { bg: "rgba(201,162,39,0.12)", text: "#C9A227", label: "Low" };
        if (ratio < 0.5) return { bg: "rgba(201,162,39,0.25)", text: "#C9A227", label: "Warm" };
        if (ratio < 0.75) return { bg: "rgba(29,122,80,0.2)", text: "#1D7A50", label: "Good" };
        return { bg: "rgba(29,122,80,0.35)", text: "#0A6B3F", label: "Hot 🔥" };
    };

    if (loading) {
        return (
            <div className={styles.dash}>
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>Dashboard</h1>
                    <p className={styles.pageDesc}>Loading campaign data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dash}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>Dashboard</h1>
                <p className={styles.pageDesc}>Campaign performance overview — Ankpa Federal Constituency</p>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                {stats.map((s, i) => (
                    <div key={i} className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: s.color + "20", color: s.color }}>{s.icon}</div>
                        <div>
                            <p className={styles.statLabel}>{s.label}</p>
                            <p className={styles.statValue}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Two Column */}
            <div className={styles.twoCol}>
                {/* LGA Breakdown */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>LGA Breakdown</h3>
                    <div className={styles.lgaList}>
                        {lgaStats.map((l, i) => (
                            <div key={i} className={styles.lgaItem}>
                                <div className={styles.lgaInfo}>
                                    <span className={styles.lgaDot} style={{ background: l.color }} />
                                    <span className={styles.lgaName}>{l.name}</span>
                                    <span className={styles.lgaCount}>{l.supporters.toLocaleString()}</span>
                                </div>
                                <div className={styles.lgaBar}>
                                    <div className={styles.lgaFill} style={{ width: `${l.percentage}%`, background: l.color }} />
                                </div>
                                <span className={styles.lgaPct}>{l.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Supporters */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Recent Registrations</h3>
                    <div className={styles.supporterList}>
                        {recent.length === 0 ? (
                            <p style={{ color: "var(--gray-mid)", fontSize: 14, padding: 16 }}>No registrations yet.</p>
                        ) : (
                            recent.map((s, i) => (
                                <div key={i} className={styles.supporterItem}>
                                    <div className={styles.supporterAvatar}>{s.full_name.split(" ").map(n => n[0]).join("")}</div>
                                    <div className={styles.supporterInfo}>
                                        <p className={styles.supporterName}>{s.full_name}</p>
                                        <p className={styles.supporterMeta}>{s.ward}, {s.lga}</p>
                                    </div>
                                    <span className={styles.supporterTime}>{timeAgo(s.created_at)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ══════ WARD-LEVEL ENGAGEMENT HEATMAP ══════ */}
            <div className={styles.card} style={{ marginTop: 20, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h3 className={styles.cardTitle} style={{ margin: 0 }}>Ward-Level Engagement Heatmap</h3>
                    <div style={{ display: "flex", gap: 12, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                        {[
                            { label: "Cold", color: "rgba(120,120,120,0.15)" },
                            { label: "Low", color: "rgba(201,162,39,0.15)" },
                            { label: "Warm", color: "rgba(201,162,39,0.3)" },
                            { label: "Good", color: "rgba(29,122,80,0.25)" },
                            { label: "Hot", color: "rgba(29,122,80,0.4)" },
                        ].map(l => (
                            <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--admin-text-muted)" }}>
                                <span style={{ width: 12, height: 12, borderRadius: 3, background: l.color, display: "inline-block" }} />
                                {l.label}
                            </span>
                        ))}
                    </div>
                </div>
                {constituencyData.map(lga => (
                    <div key={lga.name} style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: LGA_COLORS[lga.name] || "#999", marginBottom: 8 }}>
                            {lga.name} · {lga.wards.length} Wards
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {wardHeatmap.filter(w => w.lga === lga.name).map(w => {
                                const heat = getHeatColor(w.count);
                                return (
                                    <div key={w.ward} title={`${w.ward}: ${w.count} supporters`} style={{
                                        padding: "8px 12px", background: heat.bg, borderRadius: 6,
                                        border: `1px solid ${heat.text}20`, cursor: "default",
                                        minWidth: 100, textAlign: "center", transition: "0.2s",
                                    }}>
                                        <p style={{ fontSize: 10, fontWeight: 700, color: heat.text, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                                            {w.ward}
                                        </p>
                                        <p style={{ fontSize: 16, fontWeight: 900, color: heat.text, fontFamily: "var(--font-heading),sans-serif" }}>
                                            {w.count}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
