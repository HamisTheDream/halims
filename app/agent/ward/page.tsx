"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { constituencyData } from "../../data/constituencyData";

interface AgentData {
    id: string;
    full_name: string;
    phone: string;
    role: string;
    lga: string;
    ward: string;
}

interface PUAgent {
    id: string;
    full_name: string;
    phone: string;
    polling_unit_name: string | null;
    polling_unit_code: string | null;
    is_active: boolean;
    last_login: string | null;
}

interface PUResult {
    polling_unit_code: string;
    polling_unit_name: string;
    sdp_score: number;
    apc_score: number;
    pdp_score: number;
    lp_score: number;
    total_votes: number;
    accredited_voters: number;
    void_votes: number;
    is_verified: boolean;
    submitted_at: string;
    agent_name: string | null;
}

export default function WardAgentPage() {
    const router = useRouter();
    const [agent, setAgent] = useState<AgentData | null>(null);
    const [puAgents, setPuAgents] = useState<PUAgent[]>([]);
    const [results, setResults] = useState<PUResult[]>([]);
    const [supporterCount, setSupporterCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"results" | "agents" | "analytics">("results");

    useEffect(() => {
        const stored = localStorage.getItem("agent_data");
        if (!stored) { router.replace("/agent"); return; }
        const data = JSON.parse(stored) as AgentData;

        // Strict RBAC: Only Ward Agents allowed
        if (data.role !== "ward_agent") {
            localStorage.removeItem("agent_token");
            localStorage.removeItem("agent_data");
            router.replace("/agent");
            return;
        }
        setAgent(data);

        // Fetch data for this ward
        Promise.all([
            supabase.from("agents").select("*").eq("ward", data.ward).eq("role", "pu_agent").order("polling_unit_name"),
            supabase.from("election_results").select("*").eq("ward", data.ward).order("polling_unit_name"),
            supabase.from("supporters").select("*", { count: "exact", head: true }).eq("ward", data.ward),
        ]).then(([agentsRes, resultsRes, supportersRes]) => {
            setPuAgents(agentsRes.data || []);
            setResults(resultsRes.data || []);
            setSupporterCount(supportersRes.count || 0);
            setLoading(false);
        });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("agent_token");
        localStorage.removeItem("agent_data");
        router.push("/agent");
    };

    if (!agent) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A3020", color: "#C9A227" }}>Loading...</div>;

    // Ward info from constituency data
    const lgaData = constituencyData.find(l => l.name === agent.lga);
    const wardData = lgaData?.wards.find(w => w.name === agent.ward);
    const totalPUs = wardData?.pollingUnits.length || 0;

    // Collation
    const collation = {
        sdp: results.reduce((s, r) => s + r.sdp_score, 0),
        apc: results.reduce((s, r) => s + r.apc_score, 0),
        pdp: results.reduce((s, r) => s + r.pdp_score, 0),
        lp: results.reduce((s, r) => s + r.lp_score, 0),
        total: results.reduce((s, r) => s + r.total_votes, 0),
        accredited: results.reduce((s, r) => s + r.accredited_voters, 0),
        reported: results.length,
        verified: results.filter(r => r.is_verified).length,
    };

    const parties = [
        { key: "sdp", label: "SDP", color: "#1D7A50", score: collation.sdp },
        { key: "apc", label: "APC", color: "#0066B3", score: collation.apc },
        { key: "pdp", label: "PDP", color: "#e53e3e", score: collation.pdp },
        { key: "lp", label: "LP", color: "#C9A227", score: collation.lp },
    ].sort((a, b) => b.score - a.score);
    const maxScore = Math.max(...parties.map(p => p.score), 1);

    const reportPct = totalPUs > 0 ? Math.round((collation.reported / totalPUs) * 100) : 0;

    const card: React.CSSProperties = {
        padding: 20, borderRadius: 16, background: "rgba(10,48,32,0.85)",
        border: "1px solid rgba(255,255,255,0.08)", marginBottom: 16,
    };

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0A3020, #0e3d22, #145235)", padding: "20px", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>🏘️ Ward Agent Portal</h1>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{agent.full_name} · {agent.ward}, {agent.lga}</p>
                    </div>
                    <button onClick={handleLogout} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 11, cursor: "pointer" }}>
                        Sign Out
                    </button>
                </div>

                {loading ? (
                    <p style={{ color: "#C9A227", textAlign: "center", padding: 40 }}>Loading ward data...</p>
                ) : (
                    <>
                        {/* Quick Stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                            {[
                                { label: "PUs", value: totalPUs, color: "#C9A227" },
                                { label: "Reported", value: collation.reported, color: "#1D7A50" },
                                { label: "Agents", value: puAgents.length, color: "#C9A227" },
                                { label: "Supporters", value: supporterCount, color: "#1D7A50" },
                            ].map((s, i) => (
                                <div key={i} style={{ textAlign: "center", padding: 12, borderRadius: 12, background: "rgba(10,48,32,0.85)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                    <p style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</p>
                                    <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.5, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Tabs */}
                        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                            {(["results", "agents", "analytics"] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 11, fontWeight: 700,
                                        border: "1px solid " + (activeTab === tab ? "rgba(201,162,39,0.3)" : "rgba(255,255,255,0.08)"),
                                        background: activeTab === tab ? "rgba(201,162,39,0.08)" : "transparent",
                                        color: activeTab === tab ? "#C9A227" : "rgba(255,255,255,0.4)", cursor: "pointer",
                                        textTransform: "uppercase", letterSpacing: 1,
                                    }}
                                >
                                    {tab === "results" ? "🗳️ Results" : tab === "agents" ? "👥 Agents" : "📊 Analytics"}
                                </button>
                            ))}
                        </div>

                        {/* Results Tab */}
                        {activeTab === "results" && (
                            <>
                                {/* Live Scoreboard */}
                                <div style={card}>
                                    <h3 style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 12 }}>🏆 Ward Collation · {reportPct}% Reported</h3>
                                    <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, marginBottom: 14, overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${reportPct}%`, background: "linear-gradient(90deg, #C9A227, #1D7A50)", borderRadius: 3 }} />
                                    </div>
                                    {parties.map((p, i) => (
                                        <div key={p.key} style={{ marginBottom: 10 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{i === 0 ? "👑 " : ""}{p.label}</span>
                                                <span style={{ fontSize: 13, fontWeight: 900, color: p.color }}>{p.score.toLocaleString()}</span>
                                            </div>
                                            <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                                                <div style={{ height: "100%", width: `${(p.score / maxScore) * 100}%`, background: p.color, borderRadius: 3 }} />
                                            </div>
                                        </div>
                                    ))}
                                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
                                        Total: {collation.total.toLocaleString()} · Accredited: {collation.accredited.toLocaleString()}
                                    </p>
                                </div>

                                {/* PU Results List */}
                                <div style={card}>
                                    <h3 style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 12 }}>PU Results ({results.length}/{totalPUs})</h3>
                                    {results.length === 0 ? (
                                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", padding: 16 }}>No results submitted yet</p>
                                    ) : (
                                        results.map((r, i) => (
                                            <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${r.is_verified ? "rgba(29,122,80,0.2)" : "rgba(255,255,255,0.05)"}`, marginBottom: 8 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{r.polling_unit_name}</span>
                                                    {r.is_verified && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(29,122,80,0.1)", color: "#1D7A50", fontWeight: 700 }}>✓ Verified</span>}
                                                </div>
                                                <div style={{ display: "flex", gap: 10, fontSize: 10, fontWeight: 600 }}>
                                                    <span style={{ color: "#1D7A50" }}>SDP:{r.sdp_score}</span>
                                                    <span style={{ color: "#0066B3" }}>APC:{r.apc_score}</span>
                                                    <span style={{ color: "#e53e3e" }}>PDP:{r.pdp_score}</span>
                                                    <span style={{ color: "#C9A227" }}>LP:{r.lp_score}</span>
                                                    <span style={{ color: "rgba(255,255,255,0.3)" }}>Tot:{r.total_votes}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}

                        {/* Agents Tab */}
                        {activeTab === "agents" && (
                            <div style={card}>
                                <h3 style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 12 }}>PU Agents in {agent.ward} ({puAgents.length})</h3>
                                {puAgents.length === 0 ? (
                                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", padding: 16 }}>No PU agents assigned yet</p>
                                ) : (
                                    puAgents.map(a => {
                                        const hasResult = results.some(r => r.polling_unit_code === a.polling_unit_code);
                                        return (
                                            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", marginBottom: 8 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: a.is_active ? "rgba(29,122,80,0.1)" : "rgba(229,62,62,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                                                    {a.is_active ? "👤" : "⏸️"}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{a.full_name}</p>
                                                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{a.polling_unit_name || "Unassigned"} · {a.phone}</p>
                                                </div>
                                                <span style={{
                                                    padding: "3px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700,
                                                    background: hasResult ? "rgba(29,122,80,0.1)" : "rgba(201,162,39,0.1)",
                                                    color: hasResult ? "#1D7A50" : "#C9A227",
                                                }}>
                                                    {hasResult ? "Reported" : "Pending"}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* Analytics Tab */}
                        {activeTab === "analytics" && (
                            <div style={card}>
                                <h3 style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 12 }}>📊 Pre-Election Analytics</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                                    {[
                                        { label: "Registered Supporters", value: supporterCount },
                                        { label: "Polling Units", value: totalPUs },
                                        { label: "PU Agents Deployed", value: puAgents.length },
                                        { label: "Agent Coverage", value: totalPUs > 0 ? Math.round((puAgents.length / totalPUs) * 100) + "%" : "0%" },
                                    ].map((s, i) => (
                                        <div key={i} style={{ textAlign: "center", padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                            <p style={{ fontSize: 20, fontWeight: 900, color: "#C9A227" }}>{s.value}</p>
                                            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                                    PU agents without assigned PU agents will show as uncovered.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
