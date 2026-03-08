"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, Cell } from "recharts";
import { supabase } from "../../lib/supabase";
import { constituencyData } from "../../data/constituencyData";

interface PUResult {
    id: string;
    lga: string;
    ward: string;
    polling_unit_code: string;
    polling_unit_name: string;
    apc_score: number;
    apc_score: number;
    pdp_score: number;
    lp_score: number;
    total_votes: number;
    accredited_voters: number;
    void_votes: number;
    agent_name: string | null;
    is_verified: boolean;
    submitted_at: string;
}

interface Evidence {
    id: string;
    result_id: string;
    image_url: string;
    caption: string | null;
}

export default function SituationRoomPage() {
    const [results, setResults] = useState<PUResult[]>([]);
    const [evidence, setEvidence] = useState<Record<string, Evidence[]>>({});
    const [loading, setLoading] = useState(true);
    const [filterLGA, setFilterLGA] = useState("All");
    const [showSubmitForm, setShowSubmitForm] = useState(false);
    const [form, setForm] = useState({
        lga: "", ward: "", polling_unit_code: "", polling_unit_name: "",
        apc_score: 0, apc_score: 0, pdp_score: 0, lp_score: 0,
        accredited_voters: 0, void_votes: 0, agent_name: "",
    });
    const [saving, setSaving] = useState(false);
    const [viewingEvidence, setViewingEvidence] = useState<string | null>(null);

    const selectedLGA = constituencyData.find(l => l.name === form.lga);
    const selectedWard = selectedLGA?.wards.find(w => w.name === form.ward);

    const fetchResults = async () => {
        const { data } = await supabase.from("election_results").select("*").order("lga").order("ward");
        setResults(data || []);

        // Fetch evidence for all results
        const { data: evidenceData } = await supabase.from("result_evidence").select("*");
        if (evidenceData) {
            const grouped: Record<string, Evidence[]> = {};
            for (const e of evidenceData) {
                if (!grouped[e.result_id]) grouped[e.result_id] = [];
                grouped[e.result_id].push(e);
            }
            setEvidence(grouped);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchResults();

        // Subscribe to real-time updates on election_results table
        const channel = supabase
            .channel('public:election_results')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'election_results' },
                () => {
                    fetchResults();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleSubmitResult = async () => {
        if (!form.lga || !form.ward || !form.polling_unit_code) return;
        setSaving(true);
        const totalVotes = form.apc_score + form.apc_score + form.pdp_score + form.lp_score;

        await supabase.from("election_results").insert({
            lga: form.lga,
            ward: form.ward,
            polling_unit_code: form.polling_unit_code,
            polling_unit_name: form.polling_unit_name,
            apc_score: form.apc_score,
            apc_score: form.apc_score,
            pdp_score: form.pdp_score,
            lp_score: form.lp_score,
            total_votes: totalVotes,
            accredited_voters: form.accredited_voters,
            void_votes: form.void_votes,
            agent_name: form.agent_name || null,
        });

        setForm({ lga: "", ward: "", polling_unit_code: "", polling_unit_name: "", apc_score: 0, apc_score: 0, pdp_score: 0, lp_score: 0, accredited_voters: 0, void_votes: 0, agent_name: "" });
        setShowSubmitForm(false);
        setSaving(false);
        fetchResults();
    };

    const handleUploadEvidence = async (resultId: string, file: File) => {
        const ext = file.name.split(".").pop();
        const fileName = `results/${resultId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("evidence").upload(fileName, file, { cacheControl: "3600" });
        if (uploadError) { alert("Upload failed: " + uploadError.message); return; }
        const { data: urlData } = supabase.storage.from("evidence").getPublicUrl(fileName);

        await supabase.from("result_evidence").insert({ result_id: resultId, image_url: urlData.publicUrl, caption: "Result Sheet" });
        fetchResults();
    };

    const toggleVerified = async (id: string, current: boolean) => {
        await supabase.from("election_results").update({ is_verified: !current, verified_at: !current ? new Date().toISOString() : null }).eq("id", id);
        fetchResults();
    };

    const filtered = filterLGA === "All" ? results : results.filter(r => r.lga === filterLGA);

    // Collation
    const collation = {
        apc: filtered.reduce((s, r) => s + r.apc_score, 0),
        apc: filtered.reduce((s, r) => s + r.apc_score, 0),
        pdp: filtered.reduce((s, r) => s + r.pdp_score, 0),
        lp: filtered.reduce((s, r) => s + r.lp_score, 0),
        total: filtered.reduce((s, r) => s + r.total_votes, 0),
        accredited: filtered.reduce((s, r) => s + r.accredited_voters, 0),
        voided: filtered.reduce((s, r) => s + r.void_votes, 0),
        pusReported: filtered.length,
    };

    const totalPUs = filterLGA === "All"
        ? constituencyData.reduce((s, l) => s + l.wards.reduce((ws, w) => ws + w.pollingUnits.length, 0), 0)
        : constituencyData.find(l => l.name === filterLGA)?.wards.reduce((s, w) => s + w.pollingUnits.length, 0) || 0;

    const reportPercentage = totalPUs > 0 ? Math.round((collation.pusReported / totalPUs) * 100) : 0;

    // Ward-level collation
    const wardCollation = new Map<string, { apc: number; apc: number; pdp: number; lp: number; total: number; pus: number }>();
    for (const r of filtered) {
        const key = `${r.lga}|${r.ward}`;
        if (!wardCollation.has(key)) wardCollation.set(key, { apc: 0, apc: 0, pdp: 0, lp: 0, total: 0, pus: 0 });
        const wc = wardCollation.get(key)!;
        wc.apc += r.apc_score;
        wc.apc += r.apc_score;
        wc.pdp += r.pdp_score;
        wc.lp += r.lp_score;
        wc.total += r.total_votes;
        wc.pus += 1;
    }

    const parties = [
        { key: "apc", label: "APC", color: "#1D7A50", score: collation.apc },
        { key: "apc", label: "APC", color: "#0066B3", score: collation.apc },
        { key: "pdp", label: "PDP", color: "#e53e3e", score: collation.pdp },
        { key: "lp", label: "LP", color: "#C9A227", score: collation.lp },
    ].sort((a, b) => b.score - a.score);

    const maxScore = Math.max(...parties.map(p => p.score), 1);

    const card: React.CSSProperties = {
        background: "var(--admin-card)", border: "1px solid var(--admin-border)",
        borderRadius: 16, padding: 24, marginBottom: 20,
    };

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--admin-border)",
        background: "var(--admin-bg)", color: "var(--admin-text)", fontSize: 13,
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--admin-text)" }}>🗳️ Election Situation Room</h1>
                    <p style={{ fontSize: 14, color: "var(--admin-text-muted)", marginTop: 4 }}>
                        Real-time results collation — {collation.pusReported} of {totalPUs} PUs reported ({reportPercentage}%)
                    </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <select value={filterLGA} onChange={e => setFilterLGA(e.target.value)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--admin-border)", background: "var(--admin-card)", color: "var(--admin-text)", fontSize: 13, fontWeight: 600 }}>
                        <option value="All">All LGAs</option>
                        {constituencyData.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
                    </select>
                    <button onClick={() => setShowSubmitForm(!showSubmitForm)} style={{ padding: "8px 16px", borderRadius: 8, background: "#1D7A50", color: "#fff", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}>
                        {showSubmitForm ? "✕ Cancel" : "+ Submit Result"}
                    </button>
                </div>
            </div>

            {loading ? (
                <p style={{ color: "var(--admin-text-muted)", textAlign: "center", padding: 40 }}>Loading results...</p>
            ) : (
                <>
                    {/* Submit Result Form */}
                    {showSubmitForm && (
                        <div style={{ ...card, borderColor: "#C9A227" }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--admin-text)", marginBottom: 16 }}>Submit PU Result</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--admin-text-muted)", display: "block", marginBottom: 4 }}>LGA</label>
                                    <select style={inputStyle} value={form.lga} onChange={e => setForm({ ...form, lga: e.target.value, ward: "", polling_unit_code: "", polling_unit_name: "" })}>
                                        <option value="">Select LGA</option>
                                        {constituencyData.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--admin-text-muted)", display: "block", marginBottom: 4 }}>Ward</label>
                                    <select style={inputStyle} value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value, polling_unit_code: "", polling_unit_name: "" })} disabled={!form.lga}>
                                        <option value="">Select Ward</option>
                                        {selectedLGA?.wards.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--admin-text-muted)", display: "block", marginBottom: 4 }}>Polling Unit</label>
                                    <select style={inputStyle} value={form.polling_unit_code} onChange={e => { const pu = selectedWard?.pollingUnits.find(p => p.code === e.target.value); setForm({ ...form, polling_unit_code: e.target.value, polling_unit_name: pu?.name || "" }); }} disabled={!form.ward}>
                                        <option value="">Select PU</option>
                                        {selectedWard?.pollingUnits.map(pu => <option key={pu.code} value={pu.code}>{pu.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
                                {[
                                    { label: "APC Score", key: "apc_score" as const, color: "#1D7A50" },
                                    { label: "APC Score", key: "apc_score" as const, color: "#0066B3" },
                                    { label: "PDP Score", key: "pdp_score" as const, color: "#e53e3e" },
                                    { label: "LP Score", key: "lp_score" as const, color: "#C9A227" },
                                ].map(p => (
                                    <div key={p.key}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: p.color, display: "block", marginBottom: 4 }}>{p.label}</label>
                                        <input type="number" min={0} style={inputStyle} value={form[p.key]} onChange={e => setForm({ ...form, [p.key]: parseInt(e.target.value) || 0 })} />
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--admin-text-muted)", display: "block", marginBottom: 4 }}>Accredited Voters</label>
                                    <input type="number" min={0} style={inputStyle} value={form.accredited_voters} onChange={e => setForm({ ...form, accredited_voters: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--admin-text-muted)", display: "block", marginBottom: 4 }}>Void Votes</label>
                                    <input type="number" min={0} style={inputStyle} value={form.void_votes} onChange={e => setForm({ ...form, void_votes: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--admin-text-muted)", display: "block", marginBottom: 4 }}>Agent Name</label>
                                    <input style={inputStyle} placeholder="Reporting agent" value={form.agent_name} onChange={e => setForm({ ...form, agent_name: e.target.value })} />
                                </div>
                            </div>
                            <button onClick={handleSubmitResult} disabled={saving || !form.polling_unit_code} style={{ padding: "10px 24px", borderRadius: 8, background: "#1D7A50", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", opacity: (saving || !form.polling_unit_code) ? 0.5 : 1 }}>
                                {saving ? "Submitting..." : "✓ Submit Result"}
                            </button>
                        </div>
                    )}

                    {/* Live Collation Dashboard */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                        {/* Party Scoreboard - Recharts */}
                        <div style={{ ...card, padding: "20px 0" }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--admin-text)", marginBottom: 16, padding: "0 20px" }}>🏆 Live Scoreboard</h3>
                            <div style={{ height: 280, width: "100%" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={parties}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--admin-border)" />
                                        <XAxis type="number" stroke="var(--admin-text-muted)" fontSize={12} tickFormatter={(value) => value.toLocaleString()} />
                                        <YAxis dataKey="label" type="category" stroke="var(--admin-text-muted)" fontSize={12} width={50} />
                                        <Tooltip
                                            cursor={{ fill: "var(--admin-border)", opacity: 0.4 }}
                                            contentStyle={{ backgroundColor: "var(--admin-card)", borderColor: "var(--admin-border)", color: "#fff", borderRadius: 8, fontSize: 12 }}
                                            formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString() : value, "Votes"]}
                                        />
                                        <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={32}>
                                            {parties.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ fontSize: 11, color: "var(--admin-text-muted)", marginTop: 12, borderTop: "1px solid var(--admin-border)", paddingTop: 12, padding: "12px 20px 0" }}>
                                Total Votes: <strong>{collation.total.toLocaleString()}</strong> · Accredited: <strong>{collation.accredited.toLocaleString()}</strong> · Void: <strong>{collation.voided.toLocaleString()}</strong>
                            </div>
                        </div>

                        {/* Progress */}
                        <div style={card}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--admin-text)", marginBottom: 16 }}>📊 Reporting Progress</h3>
                            <div style={{ textAlign: "center", padding: "20px 0" }}>
                                <p style={{ fontSize: 48, fontWeight: 900, color: "#C9A227", fontFamily: "var(--font-heading)" }}>{reportPercentage}%</p>
                                <p style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>{collation.pusReported} of {totalPUs} polling units reported</p>
                            </div>
                            <div style={{ height: 12, background: "var(--admin-border)", borderRadius: 6, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${reportPercentage}%`, background: "linear-gradient(90deg, #C9A227, #1D7A50)", borderRadius: 6, transition: "width 0.5s" }} />
                            </div>

                            {/* LGA Progress */}
                            <div style={{ marginTop: 20 }}>
                                {constituencyData.map(lga => {
                                    const lgaPUs = lga.wards.reduce((s, w) => s + w.pollingUnits.length, 0);
                                    const lgaReported = results.filter(r => r.lga === lga.name).length;
                                    const lgaPct = lgaPUs > 0 ? Math.round((lgaReported / lgaPUs) * 100) : 0;
                                    return (
                                        <div key={lga.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--admin-text)", minWidth: 80 }}>{lga.name}</span>
                                            <div style={{ flex: 1, height: 6, background: "var(--admin-border)", borderRadius: 3, overflow: "hidden" }}>
                                                <div style={{ height: "100%", width: `${lgaPct}%`, background: "#1D7A50", borderRadius: 3 }} />
                                            </div>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--admin-text-muted)", minWidth: 40 }}>{lgaReported}/{lgaPUs}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Ward-Level Collation Table */}
                    <div style={card}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--admin-text)", marginBottom: 16 }}>Ward-Level Collation</h3>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid var(--admin-border)" }}>
                                    {["LGA", "Ward", "PUs", "APC", "APC", "PDP", "LP", "Total"].map(h => (
                                        <th key={h} style={{ textAlign: h === "LGA" || h === "Ward" ? "left" : "center", padding: "10px 8px", fontWeight: 700, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-muted)" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from(wardCollation.entries()).map(([key, wc]) => {
                                    const [lga, ward] = key.split("|");
                                    const leading = Math.max(wc.apc, wc.apc, wc.pdp, wc.lp);
                                    return (
                                        <tr key={key} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                                            <td style={{ padding: "8px", fontWeight: 600, color: "var(--admin-text)" }}>{lga}</td>
                                            <td style={{ padding: "8px", color: "var(--admin-text)" }}>{ward}</td>
                                            <td style={{ padding: "8px", textAlign: "center", color: "var(--admin-text-muted)" }}>{wc.pus}</td>
                                            <td style={{ padding: "8px", textAlign: "center", fontWeight: wc.apc === leading ? 900 : 400, color: wc.apc === leading ? "#1D7A50" : "var(--admin-text)" }}>{wc.apc}</td>
                                            <td style={{ padding: "8px", textAlign: "center", fontWeight: wc.apc === leading ? 900 : 400, color: wc.apc === leading ? "#0066B3" : "var(--admin-text)" }}>{wc.apc}</td>
                                            <td style={{ padding: "8px", textAlign: "center", fontWeight: wc.pdp === leading ? 900 : 400, color: wc.pdp === leading ? "#e53e3e" : "var(--admin-text)" }}>{wc.pdp}</td>
                                            <td style={{ padding: "8px", textAlign: "center", fontWeight: wc.lp === leading ? 900 : 400, color: wc.lp === leading ? "#C9A227" : "var(--admin-text)" }}>{wc.lp}</td>
                                            <td style={{ padding: "8px", textAlign: "center", fontWeight: 700, color: "var(--admin-text)" }}>{wc.total}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* PU-Level Results */}
                    <div style={card}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--admin-text)", marginBottom: 16 }}>
                            PU-Level Results ({filtered.length})
                        </h3>
                        {filtered.length === 0 ? (
                            <p style={{ color: "var(--admin-text-muted)", textAlign: "center", padding: 20 }}>No results submitted yet. Click &quot;+ Submit Result&quot; to begin.</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {filtered.map(r => (
                                    <div key={r.id} style={{ padding: "12px 16px", borderRadius: 10, background: "var(--admin-bg)", border: `1px solid ${r.is_verified ? "rgba(29,122,80,0.3)" : "var(--admin-border)"}` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--admin-text)" }}>{r.polling_unit_name}</p>
                                                <p style={{ fontSize: 10, color: "var(--admin-text-muted)" }}>{r.ward} · {r.lga} · {r.polling_unit_code}</p>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                {r.is_verified && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(29,122,80,0.1)", color: "#1D7A50", fontWeight: 700 }}>✓ Verified</span>}
                                                <button onClick={() => toggleVerified(r.id, r.is_verified)} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, border: "1px solid var(--admin-border)", background: "transparent", color: "var(--admin-text)", cursor: "pointer" }}>
                                                    {r.is_verified ? "Unverify" : "Verify ✓"}
                                                </button>
                                                <label style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, border: "1px solid var(--admin-border)", background: "transparent", color: "var(--admin-text)", cursor: "pointer" }}>
                                                    📷 Upload
                                                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) handleUploadEvidence(r.id, e.target.files[0]); }} />
                                                </label>
                                                {evidence[r.id] && (
                                                    <button onClick={() => setViewingEvidence(viewingEvidence === r.id ? null : r.id)} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, border: "1px solid #C9A227", background: "rgba(201,162,39,0.1)", color: "#C9A227", cursor: "pointer", fontWeight: 700 }}>
                                                        📸 {evidence[r.id].length}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11 }}>
                                            <span style={{ color: "#1D7A50", fontWeight: 700 }}>APC: {r.apc_score}</span>
                                            <span style={{ color: "#0066B3", fontWeight: 700 }}>APC: {r.apc_score}</span>
                                            <span style={{ color: "#e53e3e", fontWeight: 700 }}>PDP: {r.pdp_score}</span>
                                            <span style={{ color: "#C9A227", fontWeight: 700 }}>LP: {r.lp_score}</span>
                                            <span style={{ color: "var(--admin-text-muted)" }}>Total: {r.total_votes}</span>
                                        </div>
                                        {/* Evidence thumbnails */}
                                        {viewingEvidence === r.id && evidence[r.id] && (
                                            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                                                {evidence[r.id].map(ev => (
                                                    <a key={ev.id} href={ev.image_url} target="_blank" rel="noopener noreferrer">
                                                        <img src={ev.image_url} alt="Result evidence" style={{ width: 100, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--admin-border)" }} />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
