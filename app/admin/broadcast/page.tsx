"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { constituencyData } from "../../data/constituencyData";

export default function WhatsAppBroadcastPage() {
    const [message, setMessage] = useState("");
    const [filterLGA, setFilterLGA] = useState("All");
    const [filterWard, setFilterWard] = useState("All");
    const [supporters, setSupporters] = useState<{ full_name: string; phone: string; whatsapp: string | null; lga: string; ward: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [generated, setGenerated] = useState<string[]>([]);

    const selectedLGA = constituencyData.find(l => l.name === filterLGA);

    useEffect(() => {
        async function load() {
            const { data } = await supabase
                .from("supporters")
                .select("full_name, phone, whatsapp, lga, ward")
                .order("lga");
            setSupporters(data || []);
            setLoading(false);
        }
        load();
    }, []);

    const filtered = supporters.filter(s => {
        if (filterLGA !== "All" && s.lga !== filterLGA) return false;
        if (filterWard !== "All" && s.ward !== filterWard) return false;
        return true;
    });

    const getWhatsAppNumber = (s: { phone: string; whatsapp: string | null }) => {
        const num = s.whatsapp || s.phone;
        // Clean the number
        let clean = num.replace(/[^0-9+]/g, "");
        if (clean.startsWith("0")) clean = "234" + clean.slice(1);
        if (clean.startsWith("+")) clean = clean.slice(1);
        return clean;
    };

    const generateLinks = () => {
        const links = filtered.map(s => {
            const num = getWhatsAppNumber(s);
            const personalMsg = message.replace(/\{\{name\}\}/g, s.full_name.split(" ")[0]);
            const encoded = encodeURIComponent(personalMsg);
            return `https://wa.me/${num}?text=${encoded}`;
        });
        setGenerated(links);

        // Log broadcast
        supabase.from("broadcast_log").insert({
            channel: "whatsapp",
            message,
            audience_filter: filterLGA === "All" ? "all" : filterWard !== "All" ? `ward:${filterWard}` : `lga:${filterLGA}`,
            recipient_count: links.length,
        });
    };

    const card: React.CSSProperties = {
        background: "var(--admin-card)", border: "1px solid var(--admin-border)",
        borderRadius: 16, padding: 24, marginBottom: 20,
    };

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--admin-text)" }}>WhatsApp Broadcast</h1>
                <p style={{ fontSize: 14, color: "var(--admin-text-muted)", marginTop: 4 }}>
                    Generate personalized wa.me links for bulk WhatsApp messaging — {supporters.length} total supporters
                </p>
            </div>

            {/* Compose */}
            <div style={card}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--admin-text)", marginBottom: 16 }}>📝 Compose Message</h3>
                <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={"Dear {{name}}, the Halims campaign needs your support! Join us at our upcoming rally..."}
                    style={{
                        width: "100%", minHeight: 120, padding: 14, borderRadius: 10, border: "1px solid var(--admin-border)",
                        background: "var(--admin-bg)", color: "var(--admin-text)", fontSize: 13, fontFamily: "inherit", resize: "vertical",
                    }}
                />
                <p style={{ fontSize: 11, color: "var(--admin-text-muted)", marginTop: 6 }}>
                    Use <code style={{ background: "var(--admin-border)", padding: "2px 6px", borderRadius: 4 }}>{"{{name}}"}</code> to personalize with supporter&apos;s first name
                </p>
            </div>

            {/* Audience Filter */}
            <div style={card}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--admin-text)", marginBottom: 16 }}>🎯 Select Audience</h3>
                <div style={{ display: "flex", gap: 14 }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--admin-text-muted)", marginBottom: 4, display: "block" }}>LGA</label>
                        <select
                            value={filterLGA}
                            onChange={e => { setFilterLGA(e.target.value); setFilterWard("All"); }}
                            style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--admin-border)", background: "var(--admin-bg)", color: "var(--admin-text)", fontSize: 13 }}
                        >
                            <option value="All">All LGAs</option>
                            {constituencyData.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--admin-text-muted)", marginBottom: 4, display: "block" }}>Ward</label>
                        <select
                            value={filterWard}
                            onChange={e => setFilterWard(e.target.value)}
                            disabled={filterLGA === "All"}
                            style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--admin-border)", background: "var(--admin-bg)", color: "var(--admin-text)", fontSize: 13 }}
                        >
                            <option value="All">All Wards</option>
                            {selectedLGA?.wards.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
                        </select>
                    </div>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#C9A227", marginTop: 14 }}>
                    📊 {loading ? "Loading..." : `${filtered.length} recipient${filtered.length !== 1 ? "s" : ""} selected`}
                </p>
            </div>

            {/* Generate */}
            <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
                <button
                    onClick={generateLinks}
                    disabled={!message.trim() || filtered.length === 0}
                    style={{
                        padding: "14px 28px", borderRadius: 12, background: "#25D366", color: "#fff", fontWeight: 800,
                        fontSize: 14, border: "none", cursor: "pointer", opacity: (!message.trim() || filtered.length === 0) ? 0.5 : 1,
                    }}
                >
                    📲 Generate {filtered.length} WhatsApp Links
                </button>
            </div>

            {/* Results */}
            {generated.length > 0 && (
                <div style={card}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--admin-text)", marginBottom: 16 }}>
                        ✅ {generated.length} links generated — click each to open WhatsApp
                    </h3>
                    <div style={{ maxHeight: 400, overflow: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                        {filtered.map((s, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", borderRadius: 8, background: "var(--admin-bg)", border: "1px solid var(--admin-border)" }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--admin-text)", flex: 1 }}>{s.full_name}</span>
                                <span style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>{s.lga} · {s.ward}</span>
                                <a
                                    href={generated[i]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ padding: "5px 14px", borderRadius: 6, background: "#25D366", color: "#fff", fontSize: 11, fontWeight: 700, textDecoration: "none" }}
                                >
                                    💬 Send
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
