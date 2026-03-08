"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { constituencyData } from "../../data/constituencyData";

interface ChecklistItem {
    id: string;
    lga: string;
    ward: string;
    polling_unit_name: string;
    polling_unit_code: string;
    agent_name: string | null;
    materials_present: boolean;
    agents_present: boolean;
    pu_opened: boolean;
    voting_started: boolean;
    voting_ended: boolean;
    result_announced: boolean;
    notes: string | null;
    updated_at: string;
}

export default function ElectionDayPage() {
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterLGA, setFilterLGA] = useState("All");
    const [initialized, setInitialized] = useState(false);

    const fetchChecklist = async () => {
        const { data } = await supabase.from("election_checklist").select("*").order("lga").order("ward");
        setItems(data || []);
        setLoading(false);
        if (data && data.length > 0) setInitialized(true);
    };

    useEffect(() => { fetchChecklist(); }, []);

    const initializeChecklist = async () => {
        setLoading(true);
        const rows: { lga: string; ward: string; polling_unit_code: string; polling_unit_name: string }[] = [];
        for (const lga of constituencyData) {
            for (const ward of lga.wards) {
                for (const pu of ward.pollingUnits) {
                    rows.push({ lga: lga.name, ward: ward.name, polling_unit_code: pu.code, polling_unit_name: pu.name });
                }
            }
        }
        // Insert in batches of 100
        let hasError = false;
        for (let i = 0; i < rows.length; i += 100) {
            const { error } = await supabase.from("election_checklist").insert(rows.slice(i, i + 100));
            if (error) {
                hasError = true;
                alert("❌ Error initializing checklist: " + error.message + "\n\nMake sure you have run the SQL migration on your Supabase dashboard first.");
                break;
            }
        }
        if (!hasError) {
            alert("✅ All " + rows.length + " polling units initialized successfully!");
        }
        fetchChecklist();
    };

    const toggleField = async (id: string, field: string, current: boolean) => {
        await supabase.from("election_checklist").update({ [field]: !current, updated_at: new Date().toISOString() }).eq("id", id);
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: !current } : item));
    };

    const filtered = filterLGA === "All" ? items : items.filter(i => i.lga === filterLGA);

    // Group by LGA -> Ward
    const grouped = new Map<string, Map<string, ChecklistItem[]>>();
    for (const item of filtered) {
        if (!grouped.has(item.lga)) grouped.set(item.lga, new Map());
        const lgaMap = grouped.get(item.lga)!;
        if (!lgaMap.has(item.ward)) lgaMap.set(item.ward, []);
        lgaMap.get(item.ward)!.push(item);
    }

    const checkFields = ["materials_present", "agents_present", "pu_opened", "voting_started", "voting_ended", "result_announced"] as const;
    const checkLabels = ["Materials", "Agents", "Opened", "Voting", "Ended", "Results"];

    // Stats
    const totalPUs = filtered.length;
    const puOpened = filtered.filter(i => i.pu_opened).length;
    const votingStarted = filtered.filter(i => i.voting_started).length;
    const resultsAnnounced = filtered.filter(i => i.result_announced).length;

    const card: React.CSSProperties = {
        background: "var(--admin-card)", border: "1px solid var(--admin-border)",
        borderRadius: 16, padding: 24, marginBottom: 20,
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--admin-text)" }}>🏁 Election Day Checklist</h1>
                    <p style={{ fontSize: 14, color: "var(--admin-text-muted)", marginTop: 4 }}>
                        Track the status of every polling unit on election day
                    </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <select
                        value={filterLGA}
                        onChange={e => setFilterLGA(e.target.value)}
                        style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--admin-border)", background: "var(--admin-card)", color: "var(--admin-text)", fontSize: 13, fontWeight: 600 }}
                    >
                        <option value="All">All LGAs</option>
                        {constituencyData.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
                    </select>
                    {!initialized && (
                        <button onClick={initializeChecklist} style={{ padding: "8px 16px", borderRadius: 8, background: "#1D7A50", color: "#fff", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}>
                            Initialize All PUs
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <p style={{ color: "var(--admin-text-muted)", textAlign: "center", padding: 40 }}>Loading checklist...</p>
            ) : !initialized ? (
                <div style={{ textAlign: "center", padding: 60, color: "var(--admin-text-muted)" }}>
                    <p style={{ fontSize: 18, marginBottom: 12 }}>📋 Checklist not yet initialized</p>
                    <p style={{ fontSize: 13 }}>Click &quot;Initialize All PUs&quot; to create checklist entries for all 1,714 polling units.</p>
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
                        {[
                            { label: "Total PUs", value: totalPUs, color: "#C9A227" },
                            { label: "PUs Opened", value: puOpened, color: "#1D7A50" },
                            { label: "Voting Started", value: votingStarted, color: "#1D7A50" },
                            { label: "Results Announced", value: resultsAnnounced, color: resultsAnnounced === totalPUs ? "#1D7A50" : "#C9A227" },
                        ].map((s, i) => (
                            <div key={i} style={{ ...card, textAlign: "center", marginBottom: 0 }}>
                                <p style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: "var(--font-heading)" }}>{s.value}</p>
                                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-muted)" }}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Progress Bar */}
                    <div style={card}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--admin-text)" }}>Overall Progress</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#C9A227" }}>{totalPUs > 0 ? Math.round((resultsAnnounced / totalPUs) * 100) : 0}%</span>
                        </div>
                        <div style={{ height: 8, background: "var(--admin-border)", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${totalPUs > 0 ? (resultsAnnounced / totalPUs) * 100 : 0}%`, background: "linear-gradient(90deg, #C9A227, #1D7A50)", borderRadius: 4, transition: "width 0.5s" }} />
                        </div>
                    </div>

                    {/* Ward-by-Ward */}
                    {Array.from(grouped.entries()).map(([lgaName, wards]) => (
                        <div key={lgaName}>
                            <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "#C9A227", marginBottom: 12, marginTop: 20 }}>
                                {lgaName}
                            </h3>
                            {Array.from(wards.entries()).map(([wardName, pus]) => (
                                <div key={wardName} style={{ ...card, padding: 16 }}>
                                    <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--admin-text)", marginBottom: 8 }}>
                                        {wardName} · {pus.length} PUs · {pus.filter(p => p.result_announced).length}/{pus.length} done
                                    </h4>
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                                            <thead>
                                                <tr style={{ borderBottom: "1px solid var(--admin-border)" }}>
                                                    <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, color: "var(--admin-text-muted)", fontSize: 9, letterSpacing: 1 }}>POLLING UNIT</th>
                                                    {checkLabels.map(l => (
                                                        <th key={l} style={{ textAlign: "center", padding: "6px 4px", fontWeight: 700, color: "var(--admin-text-muted)", fontSize: 9, letterSpacing: 1 }}>{l.toUpperCase()}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pus.map(pu => (
                                                    <tr key={pu.id} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                                                        <td style={{ padding: "6px 8px", color: "var(--admin-text)", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={pu.polling_unit_name}>
                                                            {pu.polling_unit_name}
                                                        </td>
                                                        {checkFields.map(field => (
                                                            <td key={field} style={{ textAlign: "center", padding: "6px 4px" }}>
                                                                <button
                                                                    onClick={() => toggleField(pu.id, field, pu[field])}
                                                                    style={{
                                                                        width: 24, height: 24, borderRadius: 6, border: "1px solid var(--admin-border)",
                                                                        background: pu[field] ? "#1D7A50" : "transparent",
                                                                        color: pu[field] ? "#fff" : "var(--admin-text-muted)",
                                                                        cursor: "pointer", fontSize: 12,
                                                                    }}
                                                                >
                                                                    {pu[field] ? "✓" : ""}
                                                                </button>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}
