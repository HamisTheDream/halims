"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { constituencyData } from "../../data/constituencyData";

interface Agent {
    id: string;
    full_name: string;
    phone: string;
    role: string;
    lga: string;
    ward: string;
    polling_unit_code: string | null;
    polling_unit_name: string | null;
    is_active: boolean;
    last_login: string | null;
    created_at: string;
}

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ full_name: "", phone: "", lga: "", ward: "", polling_unit_code: "", polling_unit_name: "", role: "pu_agent", pin: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [filterRole, setFilterRole] = useState("All");

    const selectedLGA = constituencyData.find(l => l.name === form.lga);
    const selectedWard = selectedLGA?.wards.find(w => w.name === form.ward);

    const fetchAgents = async () => {
        const { data } = await supabase.from("agents").select("*").order("role").order("lga").order("ward");
        setAgents(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchAgents(); }, []);

    const hashPin = async (pin: string) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin + "g1-salt");
        const hash = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
    };

    const handleCreate = async () => {
        if (!form.full_name || !form.phone || !form.lga || !form.ward || !form.pin) {
            setError("All fields are required"); return;
        }
        if (form.role === "pu_agent" && !form.polling_unit_code) {
            setError("PU Agents must be assigned to a specific polling unit"); return;
        }
        if (form.pin.length < 4) {
            setError("PIN must be at least 4 digits"); return;
        }
        setSaving(true);
        setError("");

        const pin_hash = await hashPin(form.pin);
        const insertData: Record<string, string | null> = {
            full_name: form.full_name,
            phone: form.phone,
            lga: form.lga,
            ward: form.ward,
            role: form.role,
            pin_hash,
            polling_unit_code: form.role === "pu_agent" ? form.polling_unit_code : null,
            polling_unit_name: form.role === "pu_agent" ? form.polling_unit_name : null,
        };

        const { error: insertError } = await supabase.from("agents").insert(insertData);

        if (insertError) {
            setError(insertError.code === "23505" ? "This phone number is already registered as an agent." : insertError.message);
            setSaving(false);
            return;
        }

        setForm({ full_name: "", phone: "", lga: "", ward: "", polling_unit_code: "", polling_unit_name: "", role: "pu_agent", pin: "" });
        setShowForm(false);
        setSaving(false);
        fetchAgents();
    };

    const toggleActive = async (id: string, current: boolean) => {
        await supabase.from("agents").update({ is_active: !current }).eq("id", id);
        fetchAgents();
    };

    const deleteAgent = async (id: string) => {
        if (!confirm("Are you sure you want to delete this agent?")) return;
        await supabase.from("agents").delete().eq("id", id);
        fetchAgents();
    };

    const filteredAgents = filterRole === "All" ? agents : agents.filter(a => a.role === filterRole);

    const wardAgentCount = agents.filter(a => a.role === "ward_agent").length;
    const puAgentCount = agents.filter(a => a.role === "pu_agent").length;

    const card: React.CSSProperties = {
        background: "var(--admin-card)", border: "1px solid var(--admin-border)",
        borderRadius: 16, padding: 24, marginBottom: 20,
    };

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--admin-border)",
        background: "var(--admin-bg)", color: "var(--admin-text)", fontSize: 13,
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 11, fontWeight: 700, color: "var(--admin-text-muted)", marginBottom: 4, display: "block",
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--admin-text)" }}>Field Agents</h1>
                    <p style={{ fontSize: 14, color: "var(--admin-text-muted)", marginTop: 4 }}>
                        {wardAgentCount} Ward Agents · {puAgentCount} PU Agents · Agent login: <code style={{ background: "var(--admin-border)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>/agent</code>
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{ padding: "10px 20px", borderRadius: 10, background: "#1D7A50", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
                >
                    {showForm ? "✕ Cancel" : "+ Add Agent"}
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                {[
                    { label: "Ward Agents", value: wardAgentCount, color: "#C9A227" },
                    { label: "PU Agents", value: puAgentCount, color: "#1D7A50" },
                    { label: "Total Active", value: agents.filter(a => a.is_active).length, color: "#1D7A50" },
                ].map((s, i) => (
                    <div key={i} style={{ ...card, textAlign: "center", marginBottom: 0 }}>
                        <p style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: "var(--font-heading)" }}>{s.value}</p>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-muted)" }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Add Agent Form */}
            {showForm && (
                <div style={{ ...card, borderColor: "#C9A227" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--admin-text)", marginBottom: 16 }}>New Agent</h3>

                    {/* Role selector */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                        {[
                            { value: "pu_agent", label: "🗳️ PU Agent", desc: "Assigned to a specific polling unit" },
                            { value: "ward_agent", label: "🏘️ Ward Agent", desc: "Supervises all PUs in a ward" },
                        ].map(r => (
                            <button
                                key={r.value}
                                onClick={() => setForm({ ...form, role: r.value, polling_unit_code: "", polling_unit_name: "" })}
                                style={{
                                    flex: 1, padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                                    background: form.role === r.value ? "rgba(29,122,80,0.1)" : "var(--admin-bg)",
                                    border: `2px solid ${form.role === r.value ? "#1D7A50" : "var(--admin-border)"}`,
                                    textAlign: "left",
                                }}
                            >
                                <p style={{ fontSize: 13, fontWeight: 700, color: form.role === r.value ? "#1D7A50" : "var(--admin-text)" }}>{r.label}</p>
                                <p style={{ fontSize: 10, color: "var(--admin-text-muted)", marginTop: 2 }}>{r.desc}</p>
                            </button>
                        ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div>
                            <label style={labelStyle}>Full Name</label>
                            <input style={inputStyle} placeholder="Agent's full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Phone Number</label>
                            <input style={inputStyle} placeholder="08012345678" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>LGA</label>
                            <select style={inputStyle} value={form.lga} onChange={e => setForm({ ...form, lga: e.target.value, ward: "", polling_unit_code: "", polling_unit_name: "" })}>
                                <option value="">Select LGA</option>
                                {constituencyData.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Ward</label>
                            <select style={inputStyle} value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value, polling_unit_code: "", polling_unit_name: "" })} disabled={!form.lga}>
                                <option value="">{form.lga ? "Select Ward" : "Select LGA first"}</option>
                                {selectedLGA?.wards.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
                            </select>
                        </div>
                        {form.role === "pu_agent" && (
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={labelStyle}>Polling Unit</label>
                                <select style={inputStyle} value={form.polling_unit_code} onChange={e => {
                                    const pu = selectedWard?.pollingUnits.find(p => p.code === e.target.value);
                                    setForm({ ...form, polling_unit_code: e.target.value, polling_unit_name: pu?.name || "" });
                                }} disabled={!form.ward}>
                                    <option value="">{form.ward ? "Select Polling Unit" : "Select Ward first"}</option>
                                    {selectedWard?.pollingUnits.map(pu => <option key={pu.code} value={pu.code}>{pu.name} ({pu.code})</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label style={labelStyle}>Login PIN (min 4 digits)</label>
                            <input style={inputStyle} type="password" placeholder="****" value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value })} />
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-end" }}>
                            <button
                                onClick={handleCreate}
                                disabled={saving}
                                style={{ padding: "10px 24px", borderRadius: 8, background: "#C9A227", color: "#0A3020", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
                            >
                                {saving ? "Creating..." : "✓ Create Agent"}
                            </button>
                        </div>
                    </div>
                    {error && <p style={{ color: "#e53e3e", fontSize: 12, marginTop: 10 }}>⚠️ {error}</p>}
                </div>
            )}

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["All", "ward_agent", "pu_agent"].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilterRole(f)}
                        style={{
                            padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                            background: filterRole === f ? "rgba(29,122,80,0.15)" : "transparent",
                            color: filterRole === f ? "#1D7A50" : "var(--admin-text-muted)",
                            border: `1px solid ${filterRole === f ? "rgba(29,122,80,0.3)" : "var(--admin-border)"}`,
                        }}
                    >
                        {f === "All" ? "All Agents" : f === "ward_agent" ? "🏘️ Ward Agents" : "🗳️ PU Agents"}
                    </button>
                ))}
            </div>

            {/* Agents List */}
            <div style={card}>
                {loading ? (
                    <p style={{ color: "var(--admin-text-muted)", textAlign: "center", padding: 20 }}>Loading agents...</p>
                ) : filteredAgents.length === 0 ? (
                    <p style={{ color: "var(--admin-text-muted)", textAlign: "center", padding: 20 }}>No agents found. Click &quot;+ Add Agent&quot; to create one.</p>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ borderBottom: "2px solid var(--admin-border)" }}>
                                {["Name", "Phone", "Role", "LGA", "Ward", "Assignment", "Status", "Actions"].map(h => (
                                    <th key={h} style={{ textAlign: "left", padding: "10px 8px", fontWeight: 700, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--admin-text-muted)" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAgents.map(a => (
                                <tr key={a.id} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                                    <td style={{ padding: "10px 8px", fontWeight: 600, color: "var(--admin-text)" }}>{a.full_name}</td>
                                    <td style={{ padding: "10px 8px", color: "var(--admin-text)" }}>{a.phone}</td>
                                    <td style={{ padding: "10px 8px" }}>
                                        <span style={{
                                            padding: "3px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700,
                                            background: a.role === "ward_agent" ? "rgba(201,162,39,0.1)" : "rgba(29,122,80,0.1)",
                                            color: a.role === "ward_agent" ? "#C9A227" : "#1D7A50",
                                        }}>
                                            {a.role === "ward_agent" ? "🏘️ WARD" : "🗳️ PU"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "10px 8px", color: "var(--admin-text)" }}>{a.lga}</td>
                                    <td style={{ padding: "10px 8px", color: "var(--admin-text)" }}>{a.ward}</td>
                                    <td style={{ padding: "10px 8px", color: "var(--admin-text-muted)", fontSize: 11, maxWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={a.polling_unit_name || "All PUs in ward"}>
                                        {a.polling_unit_name || "All PUs in ward"}
                                    </td>
                                    <td style={{ padding: "10px 8px" }}>
                                        <span style={{
                                            padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                                            background: a.is_active ? "rgba(29,122,80,0.1)" : "rgba(229,62,62,0.1)",
                                            color: a.is_active ? "#1D7A50" : "#e53e3e",
                                        }}>
                                            {a.is_active ? "Active" : "Disabled"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "10px 8px" }}>
                                        <div style={{ display: "flex", gap: 4 }}>
                                            <button onClick={() => toggleActive(a.id, a.is_active)} style={{ padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, border: "1px solid var(--admin-border)", background: "transparent", color: "var(--admin-text)", cursor: "pointer" }}>
                                                {a.is_active ? "Disable" : "Enable"}
                                            </button>
                                            <button onClick={() => deleteAgent(a.id)} style={{ padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, border: "1px solid rgba(229,62,62,0.3)", background: "rgba(229,62,62,0.05)", color: "#e53e3e", cursor: "pointer" }}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
