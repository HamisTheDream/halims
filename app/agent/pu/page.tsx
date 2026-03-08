"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import imageCompression from "browser-image-compression";
import { Wifi, WifiOff, CloudUpload, Save } from "lucide-react";

interface AgentData {
    id: string;
    full_name: string;
    phone: string;
    role: string;
    lga: string;
    ward: string;
    polling_unit_code: string;
    polling_unit_name: string;
}

interface Result {
    id: string;
    apc_score: number;
    apc_score: number;
    pdp_score: number;
    lp_score: number;
    total_votes: number;
    accredited_voters: number;
    void_votes: number;
    is_verified: boolean;
    submitted_at: string;
}

export default function PUAgentPage() {
    const router = useRouter();
    const [agent, setAgent] = useState<AgentData | null>(null);
    const [existingResult, setExistingResult] = useState<Result | null>(null);
    const [form, setForm] = useState({ apc: 0, apc: 0, pdp: 0, lp: 0, accredited: 0, void_votes: 0 });
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Offline mode state
    const [isOnline, setIsOnline] = useState(true);
    const [hasUnsyncedDraft, setHasUnsyncedDraft] = useState(false);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        const stored = localStorage.getItem("agent_data");
        if (!stored) { router.replace("/agent"); return; }
        const data = JSON.parse(stored) as AgentData;

        // Strict RBAC: Only PU Agents allowed
        if (data.role !== "pu_agent") {
            localStorage.removeItem("agent_token");
            localStorage.removeItem("agent_data");
            router.replace("/agent");
            return;
        }
        setAgent(data);

        // Load Draft if exists
        const draftKey = `draft_result_${data.polling_unit_code}`;
        const draft = localStorage.getItem(draftKey);
        if (draft) {
            setForm(JSON.parse(draft));
            setHasUnsyncedDraft(true);
        }

        // Check for existing result ONLY if online
        if (navigator.onLine) {
            supabase.from("election_results")
                .select("*")
                .eq("polling_unit_code", data.polling_unit_code)
                .single()
                .then(({ data: result }) => {
                    if (result) {
                        setExistingResult(result);
                        if (!draft) {
                            setForm({
                                apc: result.apc_score,
                                apc: result.apc_score,
                                pdp: result.pdp_score,
                                lp: result.lp_score,
                                accredited: result.accredited_voters,
                                void_votes: result.void_votes,
                            });
                        }
                    }
                });
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [router]);

    // Save Draft Locally
    const handleSaveDraft = () => {
        if (!agent) return;
        localStorage.setItem(`draft_result_${agent.polling_unit_code}`, JSON.stringify(form));
        setHasUnsyncedDraft(true);
        setSuccess("✅ Draft saved locally. Sync when you have internet.");
        setTimeout(() => setSuccess(""), 3000);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        try {
            // Compress Image
            const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
            const compressedFile = await imageCompression(selected, options);
            setFile(compressedFile);
            setFilePreview(URL.createObjectURL(compressedFile));
        } catch (err) {
            setError("Image compression failed. Use a smaller image.");
        }
    };

    const handleSubmit = async () => {
        if (!isOnline) {
            handleSaveDraft();
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        const totalVotes = form.apc + form.apc + form.pdp + form.lp;

        let resultId = existingResult?.id;

        if (existingResult) {
            // Update existing
            const { error: updateErr } = await supabase.from("election_results").update({
                apc_score: form.apc,
                apc_score: form.apc,
                pdp_score: form.pdp,
                lp_score: form.lp,
                total_votes: totalVotes,
                accredited_voters: form.accredited,
                void_votes: form.void_votes,
                submitted_at: new Date().toISOString(),
            }).eq("id", existingResult.id);

            if (updateErr) { setError(updateErr.message); setSaving(false); return; }
        } else {
            // Insert new
            const { data: inserted, error: insertErr } = await supabase.from("election_results").insert({
                lga: agent!.lga,
                ward: agent!.ward,
                polling_unit_code: agent!.polling_unit_code,
                polling_unit_name: agent!.polling_unit_name,
                apc_score: form.apc,
                apc_score: form.apc,
                pdp_score: form.pdp,
                lp_score: form.lp,
                total_votes: totalVotes,
                accredited_voters: form.accredited,
                void_votes: form.void_votes,
                agent_id: agent!.id,
                agent_name: agent!.full_name,
            }).select().single();

            if (insertErr) {
                setError(insertErr.message);
                setSaving(false);
                return;
            }
            setExistingResult(inserted);
            resultId = inserted.id;
        }

        // Clear local draft
        localStorage.removeItem(`draft_result_${agent!.polling_unit_code}`);
        setHasUnsyncedDraft(false);

        // Upload photo evidence if provided
        if (file && resultId) {
            const ext = file.name.split(".").pop();
            const fileName = `results/${resultId}/${Date.now()}.${ext}`;
            const { error: uploadErr } = await supabase.storage.from("evidence").upload(fileName, file, { cacheControl: "3600" });
            if (uploadErr) {
                setError("Result saved but photo upload failed: " + uploadErr.message);
            } else {
                const { data: urlData } = supabase.storage.from("evidence").getPublicUrl(fileName);
                await supabase.from("result_evidence").insert({
                    result_id: resultId,
                    image_url: urlData.publicUrl,
                    caption: "Result sheet from " + agent!.full_name,
                    uploaded_by_agent: agent!.id,
                });
                setUploaded(true);
            }
        }

        setSuccess("✅ Results synced to server successfully!");
        setSaving(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("agent_token");
        localStorage.removeItem("agent_data");
        router.push("/agent");
    };

    if (!agent) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A3020", color: "#C9A227" }}>Loading...</div>;

    const totalVotes = form.apc + form.apc + form.pdp + form.lp;

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 16, fontWeight: 700, textAlign: "center",
        border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff",
        outline: "none",
    };

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0A3020, #0e3d22, #145235)", padding: "20px", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
            <div style={{ maxWidth: 500, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                            🗳️ PU Agent
                            {isOnline ? <Wifi size={16} color="#1D7A50" /> : <WifiOff size={16} color="#e53e3e" />}
                        </h1>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{agent.full_name}</p>

                        {!isOnline && (
                            <div style={{ marginTop: 6, display: "inline-block", background: "rgba(229,62,62,0.2)", padding: "2px 8px", borderRadius: 4, fontSize: 10, color: "#fc8181" }}>
                                Offline Mode Active
                            </div>
                        )}
                    </div>
                    <button onClick={handleLogout} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 11, cursor: "pointer" }}>
                        Sign Out
                    </button>
                </div>

                {hasUnsyncedDraft && isOnline && (
                    <div style={{ padding: 12, borderRadius: 8, background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)", marginBottom: 20 }}>
                        <p style={{ fontSize: 12, color: "#C9A227", display: "flex", alignItems: "center", gap: 6 }}>
                            <CloudUpload size={16} /> You have unsynced draft data. Please review and submit to server.
                        </p>
                    </div>
                )}

                {/* Assignment Card */}
                <div style={{ padding: 20, borderRadius: 16, background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.2)", marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#C9A227", marginBottom: 8 }}>Your Assignment</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{agent.polling_unit_name}</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{agent.ward} · {agent.lga} · Code: {agent.polling_unit_code}</p>
                    {existingResult && (
                        <p style={{ fontSize: 11, marginTop: 8, color: existingResult.is_verified ? "#1D7A50" : "#C9A227", fontWeight: 700 }}>
                            {existingResult.is_verified ? "✅ Result Verified" : "⏳ Result Submitted to Server"}
                        </p>
                    )}
                </div>

                {/* Result Form */}
                <div style={{ padding: 24, borderRadius: 16, background: "rgba(10,48,32,0.85)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h2 style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                            {existingResult ? "Update Result" : "Election Result"}
                        </h2>
                        {!isOnline && (
                            <button onClick={handleSaveDraft} style={{ background: "transparent", border: "none", color: "#C9A227", fontSize: 11, display: "flex", gap: 4, alignItems: "center", cursor: "pointer" }}>
                                <Save size={14} /> Save Draft
                            </button>
                        )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[
                            { label: "APC", key: "apc" as const, color: "#1D7A50" },
                            { label: "APC", key: "apc" as const, color: "#0066B3" },
                            { label: "PDP", key: "pdp" as const, color: "#e53e3e" },
                            { label: "LP", key: "lp" as const, color: "#C9A227" },
                        ].map(p => (
                            <div key={p.key}>
                                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: p.color, letterSpacing: 1.5, marginBottom: 4 }}>{p.label} SCORE</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form[p.key]}
                                    onChange={e => { setForm({ ...form, [p.key]: parseInt(e.target.value) || 0 }); setHasUnsyncedDraft(true); }}
                                    style={{ ...inputStyle, borderColor: p.color + "40" }}
                                />
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 1.5, marginBottom: 4 }}>ACCREDITED</label>
                            <input type="number" min={0} value={form.accredited} onChange={e => { setForm({ ...form, accredited: parseInt(e.target.value) || 0 }); setHasUnsyncedDraft(true); }} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 1.5, marginBottom: 4 }}>VOID VOTES</label>
                            <input type="number" min={0} value={form.void_votes} onChange={e => { setForm({ ...form, void_votes: parseInt(e.target.value) || 0 }); setHasUnsyncedDraft(true); }} style={inputStyle} />
                        </div>
                    </div>

                    {/* Total */}
                    <div style={{ textAlign: "center", marginTop: 16, padding: 12, borderRadius: 10, background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.15)" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "rgba(255,255,255,0.4)" }}>TOTAL VOTES</p>
                        <p style={{ fontSize: 28, fontWeight: 900, color: "#C9A227", fontFamily: "var(--font-heading)" }}>{totalVotes}</p>
                    </div>
                </div>

                {/* Photo Upload - Only allow when online for now, or queue it? Compressed image can be queued, but let's keep it simple: required online to upload photo securely to supabase */}
                <div style={{ padding: 20, borderRadius: 16, background: "rgba(10,48,32,0.85)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 20 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 12 }}>📷 Result Sheet Photo</h2>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>Take a photo of the signed result sheet (Auto-compressed for fast upload)</p>

                    {uploaded ? (
                        <div style={{ padding: 12, borderRadius: 10, background: "rgba(29,122,80,0.1)", border: "1px solid rgba(29,122,80,0.2)", textAlign: "center" }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#1D7A50" }}>✅ Photo uploaded successfully!</p>
                        </div>
                    ) : (
                        <label style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            padding: 20, borderRadius: 12, cursor: "pointer",
                            border: "2px dashed rgba(201,162,39,0.3)",
                            background: filePreview ? "rgba(29,122,80,0.05)" : "rgba(255,255,255,0.02)",
                            color: file ? "#1D7A50" : "rgba(255,255,255,0.4)",
                            fontSize: 13, fontWeight: 600,
                            overflow: "hidden", position: "relative"
                        }}>
                            <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />
                            {filePreview ? (
                                <img src={filePreview} alt="Preview" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} />
                            ) : null}
                            <span style={{ position: "relative", zIndex: 1 }}>{file ? `📎 ${(file.size / 1024).toFixed(0)}KB (Ready)` : "📷 Tap to take photo"}</span>
                        </label>
                    )}
                </div>

                {/* Error / Success */}
                {error && (
                    <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(229,62,62,0.1)", border: "1px solid rgba(229,62,62,0.2)", color: "#e53e3e", fontSize: 12, marginBottom: 16 }}>
                        ⚠️ {error}
                    </div>
                )}
                {success && (
                    <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(29,122,80,0.1)", border: "1px solid rgba(29,122,80,0.2)", color: "#1D7A50", fontSize: 12, marginBottom: 16 }}>
                        {success}
                    </div>
                )}

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    style={{
                        width: "100%", padding: "16px 0", borderRadius: 12, border: "none",
                        background: isOnline ? "linear-gradient(135deg, #1D7A50, #145235)" : "rgba(255,255,255,0.1)",
                        color: "#fff", fontSize: 15, fontWeight: 800, letterSpacing: 1,
                        cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
                    }}
                >
                    {saving
                        ? (isOnline ? "Syncing to Server..." : "Saving Draft...")
                        : isOnline
                            ? "🗳️ Sync to Server"
                            : "💾 Save Draft Offline"}
                </button>
            </div>
        </div>
    );
}
