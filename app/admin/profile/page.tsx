"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import styles from "../dashboard.module.css";

interface AdminUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    photo_url?: string;
}

export default function AdminProfile() {
    const [admin, setAdmin] = useState<AdminUser | null>(null);
    const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", new_password: "", confirm_password: "" });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Photo upload state
    const fileRef = useRef<HTMLInputElement>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("admin_user");
        if (stored) {
            const a = JSON.parse(stored);
            setAdmin(a);
            setForm((f) => ({ ...f, first_name: a.first_name, last_name: a.last_name, phone: a.phone || "" }));
            if (a.photo_url) setPhotoPreview(a.photo_url);
        }
    }, []);

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("Photo must be under 5MB");
            return;
        }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handlePhotoUpload = async () => {
        if (!photoFile || !admin) return;
        setUploadingPhoto(true);
        setError("");

        try {
            const ext = photoFile.name.split(".").pop();
            const fileName = `admin/${admin.id}-${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from("photos")
                .upload(fileName, photoFile, { cacheControl: "3600", upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from("photos").getPublicUrl(fileName);
            const photoUrl = urlData.publicUrl;

            // Update admin record
            const token = localStorage.getItem("admin_token");
            const res = await fetch("/api/admin/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ photo_url: photoUrl }),
            });

            if (res.ok) {
                const data = await res.json();
                const updatedAdmin = { ...admin, photo_url: photoUrl, ...data.admin };
                setAdmin(updatedAdmin);
                localStorage.setItem("admin_user", JSON.stringify(updatedAdmin));
                setPhotoPreview(photoUrl);
                setPhotoFile(null);
                setMessage("Profile picture updated!");
            } else {
                // Even if API doesn't support photo_url field yet, save locally
                const updatedAdmin = { ...admin, photo_url: photoUrl };
                setAdmin(updatedAdmin);
                localStorage.setItem("admin_user", JSON.stringify(updatedAdmin));
                setPhotoPreview(photoUrl);
                setPhotoFile(null);
                setMessage("Profile picture uploaded!");
            }
        } catch (err) {
            console.error("Photo upload error:", err);
            setError("Failed to upload photo. Please try again.");
        }

        setUploadingPhoto(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (form.new_password && form.new_password !== form.confirm_password) {
            setError("Passwords do not match");
            return;
        }

        setSaving(true);
        const token = localStorage.getItem("admin_token");
        const body: Record<string, string> = {
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone,
        };
        if (form.new_password) body.new_password = form.new_password;

        try {
            const res = await fetch("/api/admin/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to update");
            } else {
                setAdmin(data.admin);
                localStorage.setItem("admin_user", JSON.stringify(data.admin));
                setMessage("Profile updated successfully!");
                setForm((f) => ({ ...f, new_password: "", confirm_password: "" }));
            }
        } catch {
            setError("Network error");
        }
        setSaving(false);
    };

    if (!admin) return null;

    const inputStyle = { width: "100%", padding: "12px 14px", border: "1px solid var(--admin-border)", background: "var(--admin-hover)", color: "var(--admin-text)", fontSize: 14, outline: "none", borderRadius: "6px" };
    const labelStyle = { display: "block" as const, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" as const, marginBottom: 6, color: "var(--admin-text-muted)" };

    return (
        <div className={styles.dash}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>My Profile</h1>
                <p className={styles.pageDesc}>Update your account information</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, maxWidth: 900 }}>
                {/* Profile Picture Card */}
                <div className={styles.card} style={{ textAlign: "center", padding: 28 }}>
                    <div style={{
                        width: 120, height: 120, borderRadius: "50%", margin: "0 auto 16px",
                        background: "var(--admin-gold-bg)", border: "3px solid #C9A227",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        overflow: "hidden", position: "relative", cursor: "pointer"
                    }} onClick={() => fileRef.current?.click()}>
                        {photoPreview ? (
                            <Image src={photoPreview} alt="Admin photo" fill style={{ objectFit: "cover" }} />
                        ) : (
                            <span style={{ fontSize: 36, fontFamily: "var(--font-heading), sans-serif", fontWeight: 800, color: "#C9A227" }}>
                                {admin.first_name[0]}{admin.last_name[0]}
                            </span>
                        )}
                    </div>

                    <h3 style={{ fontFamily: "var(--font-display), serif", fontSize: 18, color: "var(--admin-text)", marginBottom: 4 }}>
                        {admin.first_name} {admin.last_name}
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--admin-text-muted)", marginBottom: 16 }}>{admin.email}</p>

                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        style={{ display: "none" }}
                    />

                    <button
                        onClick={photoFile ? handlePhotoUpload : () => fileRef.current?.click()}
                        disabled={uploadingPhoto}
                        style={{
                            width: "100%", padding: "10px", fontSize: 12, fontWeight: 700,
                            letterSpacing: 1, textTransform: "uppercase",
                            background: photoFile ? "#C9A227" : "var(--admin-hover)",
                            color: photoFile ? "#0e3d22" : "var(--admin-text)",
                            border: `1px solid ${photoFile ? "#C9A227" : "var(--admin-border)"}`,
                            borderRadius: 6, cursor: "pointer", transition: "0.2s"
                        }}
                    >
                        {uploadingPhoto ? "Uploading..." : photoFile ? "💾 Save Photo" : "📷 Change Photo"}
                    </button>
                </div>

                {/* Account Details Card */}
                <div className={styles.card} style={{ padding: 28 }}>
                    <h3 className={styles.cardTitle}>Account Details</h3>
                    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <label style={labelStyle}>First Name</label>
                                <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Last Name</label>
                                <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} style={inputStyle} />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Email (read-only)</label>
                            <input type="email" value={admin.email} disabled style={{ ...inputStyle, opacity: 0.5 }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Phone Number</label>
                            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                        </div>

                        <hr style={{ border: "none", borderTop: "1px solid var(--admin-border)" }} />

                        <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#C9A227" }}>Change Password (optional)</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <label style={labelStyle}>New Password</label>
                                <input type="password" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} placeholder="Leave blank to keep" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Confirm Password</label>
                                <input type="password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} placeholder="Confirm new password" style={inputStyle} />
                            </div>
                        </div>

                        {error && <p style={{ color: "#dc3545", fontSize: 13, padding: "10px 14px", background: "rgba(220,53,69,0.08)", border: "1px solid rgba(220,53,69,0.3)", borderRadius: 6 }}>⚠️ {error}</p>}
                        {message && <p style={{ color: "#1D7A50", fontSize: 13, padding: "10px 14px", background: "rgba(29,122,80,0.08)", border: "1px solid rgba(29,122,80,0.3)", borderRadius: 6 }}>✅ {message}</p>}

                        <button type="submit" disabled={saving} style={{ padding: "14px 24px", fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "#C9A227", color: "#0e3d22", border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1, borderRadius: 6 }}>
                            {saving ? "Saving..." : "Update Profile"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
