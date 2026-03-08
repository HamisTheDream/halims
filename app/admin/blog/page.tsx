"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { supabase } from "../../lib/supabase";
import s from "../shared.module.css";
import Image from "next/image";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

type BlogPost = {
    id: string;
    title: string;
    category: string;
    excerpt: string;
    content: string;
    image_url: string;
    published_at: string;
    created_at: string;
};

export default function BlogCMSPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [form, setForm] = useState({
        title: "",
        category: "Campaign News",
        excerpt: "",
        content: "",
        image_url: "",
        status: "Published"
    });

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("posts")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setPosts(data);
        }
        setLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.content) {
            alert("Title and content are required.");
            return;
        }

        setUploadingImage(true);
        let finalImageUrl = form.image_url;

        // Upload featured image if selected
        if (file) {
            try {
                const ext = file.name.split(".").pop();
                const fileName = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from("media")
                    .upload(fileName, file, { cacheControl: "3600" });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from("media").getPublicUrl(fileName);
                finalImageUrl = data.publicUrl;
            } catch (err) {
                console.error("Image upload failed:", err);
                alert("Failed to upload the featured image.");
                setUploadingImage(false);
                return;
            }
        }

        // Generate slug from title
        const slug = form.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 80);

        const { error: insertError } = await supabase.from("posts").insert([{
            title: form.title,
            slug: slug,
            category: form.category,
            excerpt: form.excerpt || form.content.replace(/<[^>]+>/g, '').slice(0, 150) + "...",
            content: form.content,
            image_url: finalImageUrl,
            published_at: form.status === "Published" ? new Date().toISOString() : null
        }]);

        setUploadingImage(false);

        if (insertError) {
            console.error("Error saving post:", insertError);
            alert("Failed to save post.");
        } else {
            setShowEditor(false);
            setForm({ title: "", category: "Campaign News", excerpt: "", content: "", image_url: "", status: "Published" });
            setFile(null);
            setPreview(null);
            fetchPosts();
        }
    };

    const handleDelete = async (id: string, imageUrl: string) => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        const { error } = await supabase.from("posts").delete().eq("id", id);

        if (!error) {
            if (imageUrl) {
                const parts = imageUrl.split("/media/");
                if (parts.length === 2) {
                    await supabase.storage.from("media").remove([parts[1]]);
                }
            }
            fetchPosts();
        } else {
            console.error(error);
            alert("Failed to delete post.");
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'clean']
        ],
    };

    return (
        <div className={s.adminPage}>
            <div className={s.pageHeader}>
                <div>
                    <h1 className={s.pageTitle}>Blog / CMS</h1>
                    <p className={s.pageDesc}>{posts.length} posts · Manage campaign news and updates</p>
                </div>
                <button
                    className={showEditor ? s.outlineButton : s.addButton}
                    onClick={() => setShowEditor(!showEditor)}
                >
                    {showEditor ? "← Back to Posts" : "+ New Post"}
                </button>
            </div>

            {showEditor ? (
                <form className={`${s.card} ${s.cardPadded}`} onSubmit={handleSave}>
                    <div style={{ marginBottom: 20 }}>
                        <label className={s.formLabel}>Post Title *</label>
                        <input
                            className={s.formInput}
                            placeholder="Enter post title..."
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                        <div>
                            <label className={s.formLabel}>Category</label>
                            <select
                                className={s.formSelect}
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                            >
                                <option>Campaign News</option>
                                <option>Policy</option>
                                <option>Community</option>
                                <option>Events</option>
                                <option>Press Release</option>
                            </select>
                        </div>
                        <div>
                            <label className={s.formLabel}>Status</label>
                            <select
                                className={s.formSelect}
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                            >
                                <option>Draft</option>
                                <option>Published</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label className={s.formLabel}>Short Excerpt (Optional)</label>
                        <textarea
                            className={s.formTextarea}
                            rows={2}
                            placeholder="A brief summary for the preview cards..."
                            value={form.excerpt}
                            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                        />
                    </div>

                    <div style={{ marginBottom: 20, display: "flex", gap: "20px", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                            <label className={s.formLabel}>Featured Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ padding: "10px 0" }}
                            />
                        </div>
                        {preview && (
                            <div style={{ width: "160px", height: "90px", position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--admin-border)" }}>
                                <Image src={preview} alt="Preview" fill style={{ objectFit: "cover" }} />
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: 32 }}>
                        <label className={s.formLabel}>Content *</label>
                        <div style={{ background: "var(--admin-bg)", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--admin-border)" }}>
                            <ReactQuill
                                theme="snow"
                                value={form.content}
                                onChange={(val) => setForm({ ...form, content: val })}
                                style={{ minHeight: "350px", color: "var(--admin-text)" }}
                                modules={modules}
                            />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                        <button type="button" className={s.outlineButton} onClick={() => setShowEditor(false)}>Cancel</button>
                        <button type="submit" className={s.addButton} disabled={uploadingImage}>
                            {uploadingImage ? "Saving..." : "Save Post"}
                        </button>
                    </div>
                </form>
            ) : (
                <div className={s.card}>
                    <table className={s.table}>
                        <thead>
                            <tr>
                                <th className={s.th}>Title</th>
                                <th className={s.th}>Category</th>
                                <th className={s.th}>Status</th>
                                <th className={s.th}>Date</th>
                                <th className={s.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px 0" }}>Loading posts...</td></tr>
                            ) : posts.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>No posts yet.</td></tr>
                            ) : posts.map((p) => (
                                <tr key={p.id}>
                                    <td className={s.tdBold} style={{ maxWidth: 400 }}>{p.title}</td>
                                    <td className={s.td}><span className={s.tag}>{p.category}</span></td>
                                    <td className={s.td}>
                                        <span className={p.published_at ? s.tagGreen : s.tagMuted}>
                                            {p.published_at ? "Published" : "Draft"}
                                        </span>
                                    </td>
                                    <td className={s.td} style={{ opacity: 0.7 }}>
                                        {new Date(p.created_at).toLocaleDateString()}
                                    </td>
                                    <td className={s.td}>
                                        <button className={s.deleteBtn} onClick={() => handleDelete(p.id, p.image_url)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <style jsx global>{`
                /* Overriding Quill styles to fit dark mode better */
                .ql-toolbar {
                    background: var(--admin-card);
                    border-bottom: 1px solid var(--admin-border) !important;
                    border-radius: 6px 6px 0 0;
                }
                .ql-container {
                    font-family: var(--font-body), sans-serif !important;
                    font-size: 15px !important;
                    color: var(--admin-text);
                    border: none !important;
                }
                .ql-editor {
                    min-height: 350px;
                }
                .ql-stroke {
                    stroke: var(--admin-text-secondary) !important;
                }
                .ql-fill {
                    fill: var(--admin-text-secondary) !important;
                }
                .ql-picker-label {
                    color: var(--admin-text-secondary) !important;
                }
            `}</style>
        </div>
    );
}
