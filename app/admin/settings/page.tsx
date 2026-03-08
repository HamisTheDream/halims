"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import s from "../dashboard.module.css";

const socialFields = [
    { key: "social_facebook", label: "Facebook", icon: "📘", placeholder: "https://facebook.com/..." },
    { key: "social_twitter", label: "Twitter / X", icon: "𝕏", placeholder: "https://x.com/..." },
    { key: "social_instagram", label: "Instagram", icon: "📷", placeholder: "https://instagram.com/..." },
    { key: "social_whatsapp", label: "WhatsApp", icon: "💬", placeholder: "https://wa.me/234..." },
    { key: "social_tiktok", label: "TikTok", icon: "🎵", placeholder: "https://tiktok.com/@..." },
    { key: "social_youtube", label: "YouTube", icon: "▶️", placeholder: "https://youtube.com/@..." },
];

const contactFields = [
    { key: "contact_phone1", label: "Primary Phone", icon: "📞", placeholder: "+234 XXX XXX XXXX" },
    { key: "contact_phone2", label: "Secondary Phone", icon: "📞", placeholder: "+234 XXX XXX XXXX" },
    { key: "contact_whatsapp", label: "WhatsApp Line", icon: "💬", placeholder: "+234 XXX XXX XXXX" },
    { key: "contact_email", label: "Campaign Email", icon: "✉️", placeholder: "info@localhost:3000" },
    { key: "contact_address", label: "HQ Address", icon: "📍", placeholder: "Campaign HQ, Ankpa, Kogi State" },
];

const seoFields = [
    { key: "seo_title", label: "Site Title", placeholder: "Rt. Hon. Abdullahi Ibrahim Ali (Halims) — House of Representatives 2027" },
    { key: "seo_description", label: "Meta Description", placeholder: "Official campaign website for Rt. Hon. Abdullahi Ibrahim Ali (Halims)..." },
    { key: "seo_og_title", label: "OpenGraph Title (for social share)", placeholder: "Vote Rt. Hon. Abdullahi Ibrahim Ali (Halims) — Ankpa Federal Constituency 2027" },
    { key: "seo_og_description", label: "OpenGraph Description", placeholder: "A distinguished entrepreneur, philanthropist, and visionary leader..." },
];

export default function AdminSettings() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [uploadingFavicon, setUploadingFavicon] = useState(false);
    const [uploadingOG, setUploadingOG] = useState(false);
    const faviconRef = useRef<HTMLInputElement>(null);
    const ogRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function load() {
            const { data } = await supabase.from("site_settings").select("key, value");
            if (data) {
                const map: Record<string, string> = {};
                for (const item of data) map[item.key] = item.value || "";
                setSettings(map);
            }
            setLoading(false);
        }
        load();
    }, []);

    const updateField = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const uploadImage = async (file: File, bucket: string, path: string) => {
        const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type });
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    };

    const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingFavicon(true);
        try {
            const ext = file.name.split(".").pop() || "png";
            const url = await uploadImage(file, "site-assets", `favicon.${ext}`);
            updateField("seo_favicon", url);
            await supabase.from("site_settings").upsert({ key: "seo_favicon", value: url, updated_at: new Date().toISOString() }, { onConflict: "key" });
            setMessage("✅ Favicon uploaded!");
        } catch {
            setMessage("❌ Failed to upload favicon.");
        }
        setUploadingFavicon(false);
        setTimeout(() => setMessage(""), 4000);
    };

    const handleOGUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingOG(true);
        try {
            const ext = file.name.split(".").pop() || "png";
            const url = await uploadImage(file, "site-assets", `og-image.${ext}`);
            updateField("seo_og_image", url);
            await supabase.from("site_settings").upsert({ key: "seo_og_image", value: url, updated_at: new Date().toISOString() }, { onConflict: "key" });
            setMessage("✅ OpenGraph image uploaded!");
        } catch {
            setMessage("❌ Failed to upload OG image.");
        }
        setUploadingOG(false);
        setTimeout(() => setMessage(""), 4000);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage("");
        try {
            const allKeys = [...socialFields, ...contactFields, ...seoFields].map(f => f.key);
            for (const key of allKeys) {
                await supabase.from("site_settings").upsert(
                    { key, value: settings[key] || "", updated_at: new Date().toISOString() },
                    { onConflict: "key" }
                );
            }
            setMessage("✅ All settings saved!");
        } catch {
            setMessage("❌ Failed to save settings.");
        }
        setSaving(false);
        setTimeout(() => setMessage(""), 4000);
    };

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "10px 12px", border: "1px solid var(--admin-border)",
        borderRadius: 6, fontSize: 13, background: "var(--admin-card)", color: "var(--admin-text)",
        fontFamily: "inherit",
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" as const,
        color: "var(--admin-text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6,
    };

    const uploadBtnStyle: React.CSSProperties = {
        padding: "8px 16px", background: "var(--admin-border)", border: "none", borderRadius: 6,
        fontSize: 12, fontWeight: 700, cursor: "pointer", color: "var(--admin-text)", marginTop: 8,
    };

    if (loading) {
        return (
            <div className={s.dash}>
                <div className={s.header}><h1 className={s.pageTitle}>Settings</h1><p className={s.pageDesc}>Loading...</p></div>
            </div>
        );
    }

    return (
        <div className={s.dash}>
            <div className={s.header}>
                <h1 className={s.pageTitle}>Site Settings</h1>
                <p className={s.pageDesc}>Manage SEO, social media links, and contact information</p>
            </div>

            {/* SEO Section */}
            <div className={s.card} style={{ padding: 24, marginBottom: 20 }}>
                <h3 className={s.cardTitle}>🔍 SEO & Branding</h3>
                <p style={{ fontSize: 12, color: "var(--admin-text-muted)", marginBottom: 20 }}>
                    Favicon, OpenGraph image, site title, and description. Changes apply across the entire site.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
                    {/* Favicon */}
                    <div>
                        <label style={labelStyle}>🖼️ Favicon</label>
                        <p style={{ fontSize: 11, color: "var(--admin-text-muted)", marginBottom: 8 }}>The small icon shown in browser tabs. Use a square PNG/ICO (32×32 or 64×64).</p>
                        {settings.seo_favicon && (
                            <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={settings.seo_favicon} alt="Current favicon" style={{ width: 32, height: 32, borderRadius: 4, border: "1px solid var(--admin-border)" }} />
                                <span style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>Current favicon</span>
                            </div>
                        )}
                        <input type="file" ref={faviconRef} accept="image/png,image/x-icon,image/ico,image/svg+xml" onChange={handleFaviconUpload} style={{ display: "none" }} />
                        <button onClick={() => faviconRef.current?.click()} disabled={uploadingFavicon} style={uploadBtnStyle}>
                            {uploadingFavicon ? "Uploading..." : "📤 Upload Favicon"}
                        </button>
                    </div>

                    {/* OG Image */}
                    <div>
                        <label style={labelStyle}>🖼️ OpenGraph Image</label>
                        <p style={{ fontSize: 11, color: "var(--admin-text-muted)", marginBottom: 8 }}>The image shown when shared on Facebook, Twitter, WhatsApp. Use 1200×630px.</p>
                        {settings.seo_og_image && (
                            <div style={{ marginBottom: 8 }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={settings.seo_og_image} alt="Current OG image" style={{ width: "100%", maxWidth: 240, borderRadius: 6, border: "1px solid var(--admin-border)" }} />
                            </div>
                        )}
                        <input type="file" ref={ogRef} accept="image/png,image/jpeg,image/webp" onChange={handleOGUpload} style={{ display: "none" }} />
                        <button onClick={() => ogRef.current?.click()} disabled={uploadingOG} style={uploadBtnStyle}>
                            {uploadingOG ? "Uploading..." : "📤 Upload OG Image"}
                        </button>
                    </div>
                </div>

                {/* SEO Text Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {seoFields.map(f => (
                        <div key={f.key}>
                            <label style={labelStyle}>{f.label}</label>
                            {f.key.includes("description") ? (
                                <textarea style={{ ...inputStyle, minHeight: 50, resize: "vertical" }} value={settings[f.key] || ""} onChange={e => updateField(f.key, e.target.value)} placeholder={f.placeholder} />
                            ) : (
                                <input style={inputStyle} value={settings[f.key] || ""} onChange={e => updateField(f.key, e.target.value)} placeholder={f.placeholder} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className={s.twoCol}>
                {/* Social Media */}
                <div className={s.card} style={{ padding: 24 }}>
                    <h3 className={s.cardTitle}>📱 Social Media Links</h3>
                    <p style={{ fontSize: 12, color: "var(--admin-text-muted)", marginBottom: 16 }}>
                        These links appear in the footer and contact page.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {socialFields.map(f => (
                            <div key={f.key}>
                                <label style={labelStyle}>{f.icon} {f.label}</label>
                                <input style={inputStyle} value={settings[f.key] || ""} onChange={e => updateField(f.key, e.target.value)} placeholder={f.placeholder} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Info */}
                <div className={s.card} style={{ padding: 24 }}>
                    <h3 className={s.cardTitle}>📞 Contact Information</h3>
                    <p style={{ fontSize: 12, color: "var(--admin-text-muted)", marginBottom: 16 }}>
                        Phone numbers, email, and address shown on the footer and contact page.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {contactFields.map(f => (
                            <div key={f.key}>
                                <label style={labelStyle}>{f.icon} {f.label}</label>
                                {f.key === "contact_address" ? (
                                    <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={settings[f.key] || ""} onChange={e => updateField(f.key, e.target.value)} placeholder={f.placeholder} />
                                ) : (
                                    <input style={inputStyle} value={settings[f.key] || ""} onChange={e => updateField(f.key, e.target.value)} placeholder={f.placeholder} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Save */}
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 16 }}>
                <button onClick={handleSave} disabled={saving} style={{ padding: "12px 32px", background: "#C9A227", color: "#0A3020", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 800, letterSpacing: 1, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                    {saving ? "Saving..." : "💾 Save All Settings"}
                </button>
                {message && <span style={{ fontSize: 13, fontWeight: 600 }}>{message}</span>}
            </div>
        </div>
    );
}
