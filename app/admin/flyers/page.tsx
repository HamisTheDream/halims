"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import s from "../shared.module.css";

export default function FlyerStatsPage() {
    const [totalSupporters, setTotalSupporters] = useState(0);
    const [totalFlyers, setTotalFlyers] = useState(0);
    const [recentFlyers, setRecentFlyers] = useState<{ supporter_name: string; template: string; created_at: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            const { count: supporters } = await supabase.from("supporters").select("*", { count: "exact", head: true });
            const { count: flyers } = await supabase.from("flyer_logs").select("*", { count: "exact", head: true });
            const { data: recent } = await supabase.from("flyer_logs").select("supporter_name, template, created_at").order("created_at", { ascending: false }).limit(10);

            setTotalSupporters(supporters || 0);
            setTotalFlyers(flyers || 0);
            setRecentFlyers(recent || []);
            setLoading(false);
        }
        fetchStats();
    }, []);

    const stats = [
        { label: "Total Supporters", value: loading ? "..." : totalSupporters.toLocaleString(), icon: "👥" },
        { label: "Flyers Generated", value: loading ? "..." : totalFlyers.toLocaleString(), icon: "📸" },
        { label: "Templates Available", value: "6", icon: "🎨" },
        { label: "Flyer Resolution", value: "1080×1350", icon: "📐" },
    ];

    return (
        <div className={s.adminPage}>
            <div className={s.pageHeader}>
                <div><h1 className={s.pageTitle}>Flyer & Endorsement Stats</h1><p className={s.pageDesc}>Endorsement flyer generation analytics</p></div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
                {stats.map((st, i) => (
                    <div key={i} className={`${s.card} ${s.cardPadded}`} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                        <span style={{ fontSize: 28 }}>{st.icon}</span>
                        <div>
                            <p className={s.statLabel} style={{ marginBottom: 6 }}>{st.label}</p>
                            <p style={{ fontFamily: "var(--font-heading),sans-serif", fontSize: 28, fontWeight: 800, color: "var(--admin-text)" }}>{st.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Recent Flyers */}
                <div className={`${s.card} ${s.cardPadded}`}>
                    <h3 className={s.cardHeader}>Recent Flyer Generations</h3>
                    {recentFlyers.length === 0 ? (
                        <p style={{ fontSize: 13, color: "var(--admin-text-muted)", padding: 16 }}>No flyers generated yet.</p>
                    ) : (
                        recentFlyers.map((f, i) => (
                            <div key={i} className={s.statRow}>
                                <span className={s.statLabel}>{f.supporter_name}</span>
                                <span className={s.statValue} style={{ fontSize: 11 }}>
                                    {f.template} · {new Date(f.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                {/* Quick Links */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className={`${s.card} ${s.cardPadded}`}>
                        <h3 className={s.cardHeader}>Available Templates</h3>
                        {[
                            { name: "Victory Green", desc: "Split layout, bright background" },
                            { name: "Golden Rally", desc: "Warm golden tones" },
                            { name: "Bold APC", desc: "Dark dramatic design" },
                            { name: "Bright Future", desc: "Light and optimistic" },
                            { name: "Prestige", desc: "Clean and professional" },
                            { name: "Patriot", desc: "Deep green party colors" },
                        ].map((t, i) => (
                            <div key={i} className={s.statRow}>
                                <span className={s.statLabel}>{t.name}</span>
                                <span className={s.statValue} style={{ fontSize: 12, opacity: 0.7 }}>{t.desc}</span>
                            </div>
                        ))}
                    </div>

                    <div className={`${s.card} ${s.cardPadded}`}>
                        <h3 className={s.cardHeader}>Quick Links</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
                            <a href="/endorsement" target="_blank" rel="noopener noreferrer" style={{
                                display: "block", padding: "14px 18px", background: "var(--admin-hover)",
                                border: "1px solid var(--admin-border)", borderRadius: 8, textDecoration: "none",
                                color: "var(--admin-text)", fontFamily: "var(--font-heading), sans-serif",
                                fontSize: 13, fontWeight: 700, transition: "0.2s"
                            }}>
                                📸 Open Endorsement Flyer Generator →
                            </a>
                            <a href="/register" target="_blank" rel="noopener noreferrer" style={{
                                display: "block", padding: "14px 18px", background: "var(--admin-hover)",
                                border: "1px solid var(--admin-border)", borderRadius: 8, textDecoration: "none",
                                color: "var(--admin-text)", fontFamily: "var(--font-heading), sans-serif",
                                fontSize: 13, fontWeight: 700, transition: "0.2s"
                            }}>
                                📋 Open Supporter Registration Page →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
