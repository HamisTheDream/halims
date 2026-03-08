"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import s from "../shared.module.css";
import Image from "next/image";

type GalleryItem = {
    id: string;
    title: string;
    category: string;
    image_url: string;
    created_at: string;
};

export default function GalleryAdminPage() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    const [form, setForm] = useState({
        title: "",
        category: "Events",
    });
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

    useEffect(() => {
        fetchGallery();
    }, []);

    const fetchGallery = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("gallery")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setItems(data);
        } else {
            console.error("Error fetching gallery:", error);
        }
        setLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        if (selected.length === 0) return;

        const validFiles = selected.filter(f => f.size <= 10 * 1024 * 1024);
        if (validFiles.length !== selected.length) {
            alert("Some files were skipped because they exceed 10MB.");
        }

        setFiles(validFiles);
        setPreviews(validFiles.map(f => URL.createObjectURL(f)));
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0 || !form.title) {
            alert("Please provide a title and select at least one image.");
            return;
        }

        setUploadingFile(true);
        setUploadProgress({ current: 0, total: files.length });

        try {
            // Import browser-image-compression dynamically or assume available
            let imageCompression;
            try {
                imageCompression = (await import("browser-image-compression")).default;
            } catch (e) {
                console.warn("browser-image-compression missing, uploading uncompressed");
            }

            for (let i = 0; i < files.length; i++) {
                let currentFile = files[i];

                // Compress if library exists
                if (imageCompression) {
                    const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true };
                    try { currentFile = await imageCompression(currentFile, options); } catch (err) { console.error("Compression failed", err); }
                }

                const ext = currentFile.name.split(".").pop();
                const fileName = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from("media")
                    .upload(fileName, currentFile, { cacheControl: "3600", upsert: false });

                if (uploadError) throw new Error("Failed to upload image: " + uploadError.message);

                const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
                const publicUrl = urlData.publicUrl;

                const { error: dbError } = await supabase.from("gallery").insert([{
                    title: files.length > 1 ? `${form.title} ${i + 1}` : form.title,
                    category: form.category,
                    image_url: publicUrl
                }]);

                if (dbError) throw dbError;
                setUploadProgress({ current: i + 1, total: files.length });
            }

            setIsUploading(false);
            setForm({ title: "", category: "Events" });
            setFiles([]);
            setPreviews([]);
            fetchGallery();

        } catch (err: any) {
            console.error("Upload process failed:", err);
            alert(err.message || "Failed to complete upload.");
        } finally {
            setUploadingFile(false);
            setUploadProgress({ current: 0, total: 0 });
        }
    };

    const handleDelete = async (id: string, imageUrl: string) => {
        if (!confirm("Delete this image?")) return;

        // Delete from DB
        const { error: dbError } = await supabase.from("gallery").delete().eq("id", id);

        if (!dbError) {
            // Optionally try to delete from storage (extract path from URL)
            try {
                const pathParts = imageUrl.split("/media/");
                if (pathParts.length === 2) {
                    await supabase.storage.from("media").remove([pathParts[1]]);
                }
            } catch (e) {
                console.error("Failed to delete from storage bucket, but removed from DB", e);
            }
            fetchGallery();
        } else {
            console.error("Error deleting record:", dbError);
            alert("Failed to delete photo record.");
        }
    };

    return (
        <div className={s.adminPage}>
            <div className={s.pageHeader}>
                <div>
                    <h1 className={s.pageTitle}>Gallery Management</h1>
                    <p className={s.pageDesc}>{items.length} photos uploaded · Manage campaign images</p>
                </div>
                <button
                    className={s.addButton}
                    onClick={() => setIsUploading(!isUploading)}
                >
                    {isUploading ? "Cancel Upload" : "+ Upload Photos"}
                </button>
            </div>

            {/* Upload Form */}
            {isUploading && (
                <div className={s.card} style={{ marginBottom: "24px" }}>
                    <div className={s.cardHeader} style={{ padding: "20px 24px 0" }}>Upload New Photo</div>
                    <form className={s.cardPadded} onSubmit={handleUpload}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                            <div>
                                <label className={s.formLabel}>Photo Title *</label>
                                <input
                                    className={s.formInput}
                                    placeholder="e.g. Ankpa Rally Crowd"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className={s.formLabel}>Category *</label>
                                <select
                                    className={s.formSelect}
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                >
                                    <option value="Events">Events</option>
                                    <option value="Rallies">Rallies</option>
                                    <option value="Visits">Visits</option>
                                    <option value="Outreach">Outreach</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: "20px", display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
                            <div style={{ flex: "1 1 100%" }}>
                                <label className={s.formLabel}>Image Files (Max 10MB each) *</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange}
                                    style={{ padding: "10px 0", width: "100%" }}
                                    required
                                />
                            </div>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", width: "100%" }}>
                                {previews.map((preview, i) => (
                                    <div key={i} style={{ width: "80px", height: "60px", position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--admin-border)", flexShrink: 0 }}>
                                        <Image src={preview} alt="Preview" fill style={{ objectFit: "cover" }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 13, color: "var(--admin-text-dim)", fontWeight: 600 }}>
                                {uploadingFile && `Uploading ${uploadProgress.current} of ${uploadProgress.total}...`}
                            </span>
                            <button
                                type="submit"
                                className={s.addButton}
                                disabled={uploadingFile}
                            >
                                {uploadingFile ? "Uploading..." : `Upload Photo${files.length > 1 ? "s" : ""}`}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Gallery Grid */}
            {loading ? (
                <div style={{ padding: "40px", textAlign: "center" }}>Loading gallery...</div>
            ) : items.length === 0 ? (
                <div style={{ padding: "60px", textAlign: "center", color: "#888", background: "var(--admin-card)", borderRadius: "8px", border: `1px solid var(--admin-border)` }}>
                    No photos uploaded yet. Click 'Upload Photos' to get started.
                </div>
            ) : (
                <div className={s.galleryGrid}>
                    {items.map((item) => (
                        <div key={item.id} className={s.galleryCard}>
                            <div className={s.galleryImg} style={{ overflow: "hidden" }}>
                                {item.image_url ? (
                                    <Image src={item.image_url} alt={item.title} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 33vw" />
                                ) : (
                                    <span className={s.galleryImgIcon}>🖼️</span>
                                )}
                            </div>
                            <div className={s.galleryBody}>
                                <p className={s.galleryLabel}>{item.title}</p>
                                <p className={s.galleryMeta}>{item.category} · {new Date(item.created_at).toLocaleDateString()}</p>
                                <div className={s.galleryActions}>
                                    <button className={s.smallDeleteBtn} onClick={() => handleDelete(item.id, item.image_url)}>Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
