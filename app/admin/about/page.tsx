"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import s from "../shared.module.css";

export default function AdminAboutPage() {
    const [bio, setBio] = useState("");
    const [heroTitle, setHeroTitle] = useState("");
    const [heroSubtitle, setHeroSubtitle] = useState("");
    const [heroDesc, setHeroDesc] = useState("");
    const [manifestoUrl, setManifestoUrl] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const manifestoRef = useRef<HTMLInputElement>(null);
    const [uploadingManifesto, setUploadingManifesto] = useState(false);

    useEffect(() => {
        async function load() {
            const { data } = await supabase.from("site_settings").select("key, value");
            if (data) {
                for (const item of data) {
                    if (item.key === "about_bio") setBio(item.value || "");
                    if (item.key === "about_hero_title") setHeroTitle(item.value || "");
                    if (item.key === "about_hero_subtitle") setHeroSubtitle(item.value || "");
                    if (item.key === "about_hero_desc") setHeroDesc(item.value || "");
                    if (item.key === "manifesto_url") setManifestoUrl(item.value || "");
                }
            }
            setLoading(false);
        }
        load();
    }, []);

    const saveSetting = async (key: string, value: string) => {
        const { error: upsertError } = await supabase.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
        if (upsertError) throw upsertError;
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setMessage("");
        try {
            await saveSetting("about_bio", bio);
            await saveSetting("about_hero_title", heroTitle);
            await saveSetting("about_hero_subtitle", heroSubtitle);
            await saveSetting("about_hero_desc", heroDesc);
            setMessage("About page content saved successfully!");
        } catch (err) {
            console.error(err);
            setError("Failed to save. Please try again.");
        }
        setSaving(false);
    };

    const handleManifestoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 20 * 1024 * 1024) { setError("File must be under 20MB"); return; }

        setUploadingManifesto(true);
        setError("");
        try {
            const fileName = `manifesto/manifesto-${Date.now()}.${file.name.split('.').pop()}`;
            const { error: uploadError } = await supabase.storage
                .from("media")
                .upload(fileName, file, { cacheControl: "3600", upsert: true });
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
            const url = urlData.publicUrl;

            await saveSetting("manifesto_url", url);
            setManifestoUrl(url);
            setMessage("Manifesto uploaded successfully!");
        } catch (err) {
            console.error(err);
            setError("Failed to upload manifesto.");
        }
        setUploadingManifesto(false);
    };

    const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", border: "1px solid var(--admin-border)", background: "var(--admin-hover)", color: "var(--admin-text)", fontSize: 14, borderRadius: 6, outline: "none" };
    const labelStyle: React.CSSProperties = { display: "block", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6, color: "var(--admin-text-muted)" };

    if (loading) return <div className={s.adminPage}><p>Loading...</p></div>;

    return (
        <div className={s.adminPage}>
            <div className={s.pageHeader}>
                <div>
                    <h1 className={s.pageTitle}>About Page & Manifesto</h1>
                    <p className={s.pageDesc}>Manage the About page content and upload campaign manifesto</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, maxWidth: 1000 }}>
                {/* About Content */}
                <div className={`${s.card} ${s.cardPadded}`}>
                    <h3 className={s.cardHeader}>About Page Content</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        <div>
                            <label style={labelStyle}>Hero Title</label>
                            <input style={inputStyle} value={heroTitle} onChange={e => setHeroTitle(e.target.value)} placeholder="e.g. Rt. Hon. Abdullahi Ibrahim Ali (Halims)" />
                        </div>
                        <div>
                            <label style={labelStyle}>Hero Subtitle</label>
                            <input style={inputStyle} value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} placeholder="e.g. Entrepreneur · Philanthropist · Visionary Leader" />
                        </div>
                        <div>
                            <label style={labelStyle}>Hero Description</label>
                            <textarea style={{ ...inputStyle, minHeight: 80 }} value={heroDesc} onChange={e => setHeroDesc(e.target.value)} placeholder="Short introductory paragraph..." />
                        </div>
                        <div>
                            <label style={labelStyle}>Full Bio (supports HTML)</label>
                            <textarea style={{ ...inputStyle, minHeight: 200, fontFamily: "monospace", fontSize: 12 }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Enter the full biography content. You can use HTML tags like <p>, <strong>, <em>..." />
                        </div>

                        {error && <p style={{ color: "#dc3545", fontSize: 13, padding: "10px 14px", background: "rgba(220,53,69,0.08)", border: "1px solid rgba(220,53,69,0.3)", borderRadius: 6 }}>⚠️ {error}</p>}
                        {message && <p style={{ color: "#1D7A50", fontSize: 13, padding: "10px 14px", background: "rgba(29,122,80,0.08)", border: "1px solid rgba(29,122,80,0.3)", borderRadius: 6 }}>✅ {message}</p>}

                        <button onClick={handleSave} disabled={saving} style={{ padding: "14px 24px", fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "#C9A227", color: "#0e3d22", border: "none", cursor: "pointer", borderRadius: 6, opacity: saving ? 0.6 : 1, alignSelf: "flex-start" }}>
                            {saving ? "Saving..." : "💾 Save About Content"}
                        </button>
                    </div>
                </div>

                {/* Manifesto Upload */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className={`${s.card} ${s.cardPadded}`}>
                        <h3 className={s.cardHeader}>Campaign Manifesto</h3>
                        <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
                            Upload the campaign manifesto PDF. It will be available for download on the About page.
                        </p>

                        {manifestoUrl && (
                            <div style={{ marginBottom: 16, padding: "12px 14px", background: "var(--admin-hover)", border: "1px solid var(--admin-border)", borderRadius: 6 }}>
                                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--admin-text-muted)", marginBottom: 6 }}>Current Manifesto</p>
                                <a href={manifestoUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#C9A227", fontSize: 13, wordBreak: "break-all" }}>
                                    📄 View Current Manifesto →
                                </a>
                            </div>
                        )}

                        <input ref={manifestoRef} type="file" accept=".pdf,.doc,.docx" onChange={handleManifestoUpload} style={{ display: "none" }} />
                        <button
                            onClick={() => manifestoRef.current?.click()}
                            disabled={uploadingManifesto}
                            style={{
                                width: "100%", padding: "14px", fontSize: 12, fontWeight: 700,
                                letterSpacing: 1, textTransform: "uppercase",
                                background: "var(--admin-hover)", color: "var(--admin-text)",
                                border: "1px solid var(--admin-border)", borderRadius: 6,
                                cursor: "pointer", transition: "0.2s"
                            }}
                        >
                            {uploadingManifesto ? "Uploading..." : "📤 Upload Manifesto PDF"}
                        </button>
                    </div>

                    <div className={`${s.card} ${s.cardPadded}`}>
                        <h4 className={s.cardHeader}>Quick Tips</h4>
                        {[
                            "Use HTML tags in the bio: <p>, <strong>, <em>",
                            "Manifesto: PDF format recommended (max 20MB)",
                            "Changes appear on the public About page immediately",
                            "Leave fields empty to keep default content",
                        ].map((tip, i) => (
                            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                                <span style={{ color: "#C9A227", fontSize: 14 }}>💡</span>
                                <span style={{ fontSize: 12, color: "var(--admin-text-muted)", lineHeight: 1.6 }}>{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
