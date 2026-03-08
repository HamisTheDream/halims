"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Image from "next/image";
import styles from "./supporters.module.css";

type Supporter = {
    id: string;
    full_name: string;
    phone: string;
    whatsapp?: string;
    email?: string;
    gender: string;
    age_range: string;
    lga: string;
    ward: string;
    polling_unit_code?: string;
    polling_unit_name?: string;
    occupation?: string;
    has_pvc: string;
    volunteer: boolean;
    hear_about?: string;
    photo_url?: string;
    created_at: string;
};

const EMPTY_FORM: Omit<Supporter, "id" | "created_at"> = {
    full_name: "", phone: "", whatsapp: "", email: "", gender: "Male",
    age_range: "18-25", lga: "Ankpa", ward: "", polling_unit_code: "",
    polling_unit_name: "", occupation: "", has_pvc: "No", volunteer: false,
    hear_about: "", photo_url: "",
};

export default function SupportersPage() {
    const [supporters, setSupporters] = useState<Supporter[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [filterLGA, setFilterLGA] = useState("All");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 50;

    // Modal states
    const [selectedSupporter, setSelectedSupporter] = useState<Supporter | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => { setPage(1); }, [filterLGA, search]);
    useEffect(() => { fetchSupporters(); }, [page, filterLGA, search]);

    const fetchSupporters = async () => {
        setLoading(true);
        let query = supabase.from("supporters").select("*", { count: "exact" });
        if (filterLGA !== "All") query = query.eq("lga", filterLGA);
        if (search) query = query.ilike("full_name", `%${search}%`);
        const from = (page - 1) * limit;
        query = query.range(from, from + limit - 1).order("created_at", { ascending: false });
        const { data, count, error } = await query;
        if (!error) { setSupporters(data || []); if (count !== null) setTotalCount(count); }
        setLoading(false);
    };

    // ── ADD ──
    const handleAdd = async () => {
        if (!formData.full_name || !formData.phone) return alert("Name and phone are required.");
        setSaving(true);
        const { error } = await supabase.from("supporters").insert([{ ...formData, volunteer: formData.volunteer || false }]);
        if (error) { console.error(error); alert("Failed to add supporter."); }
        else { setShowAddModal(false); setFormData(EMPTY_FORM); fetchSupporters(); }
        setSaving(false);
    };

    // ── EDIT ──
    const handleEdit = async () => {
        if (!selectedSupporter) return;
        setSaving(true);
        const { error } = await supabase.from("supporters").update(formData).eq("id", selectedSupporter.id);
        if (error) { console.error(error); alert("Failed to update supporter."); }
        else { setSelectedSupporter(null); setEditMode(false); fetchSupporters(); }
        setSaving(false);
    };

    // ── DELETE ──
    const handleDelete = async (id: string) => {
        const { error } = await supabase.from("supporters").delete().eq("id", id);
        if (error) { console.error(error); alert("Failed to delete supporter."); }
        else { setDeleteConfirm(null); setSelectedSupporter(null); fetchSupporters(); }
    };

    const openEditMode = (s: Supporter) => {
        setFormData({
            full_name: s.full_name, phone: s.phone, whatsapp: s.whatsapp || "", email: s.email || "",
            gender: s.gender, age_range: s.age_range, lga: s.lga, ward: s.ward,
            polling_unit_code: s.polling_unit_code || "", polling_unit_name: s.polling_unit_name || "",
            occupation: s.occupation || "", has_pvc: s.has_pvc, volunteer: s.volunteer,
            hear_about: s.hear_about || "", photo_url: s.photo_url || "",
        });
        setEditMode(true);
    };

    const handleExportCSV = async () => {
        let query = supabase.from("supporters").select("*");
        if (filterLGA !== "All") query = query.eq("lga", filterLGA);
        if (search) query = query.ilike("full_name", `%${search}%`);
        const { data, error } = await query.order("created_at", { ascending: false });
        if (error || !data?.length) return alert("No data to export.");
        const headers = ["Full Name", "Phone", "WhatsApp", "Email", "Gender", "Age Range", "LGA", "Ward", "PU Code", "PU Name", "Occupation", "Has PVC", "Volunteer", "Date"];
        const rows = data.map((r: Supporter) => [r.full_name, r.phone, r.whatsapp || "", r.email || "", r.gender, r.age_range, r.lga, r.ward, r.polling_unit_code || "", r.polling_unit_name || "", r.occupation || "", r.has_pvc, r.volunteer ? "Yes" : "No", new Date(r.created_at).toLocaleDateString()].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
        const csv = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `supporters_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
    };

    const totalPages = Math.ceil(totalCount / limit);

    // ── FORM FIELD RENDERER ──
    const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid var(--admin-border)", background: "var(--admin-hover)", color: "var(--admin-text)", fontSize: 13, borderRadius: 6, outline: "none" };
    const labelStyle: React.CSSProperties = { display: "block", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, color: "var(--admin-text-muted)" };

    const renderFormFields = () => (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} /></div>
            <div><label style={labelStyle}>Phone *</label><input style={inputStyle} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div><label style={labelStyle}>WhatsApp</label><input style={inputStyle} value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} /></div>
            <div><label style={labelStyle}>Email</label><input style={inputStyle} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
            <div><label style={labelStyle}>Gender</label><select style={inputStyle} value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}><option>Male</option><option>Female</option></select></div>
            <div><label style={labelStyle}>Age Range</label><select style={inputStyle} value={formData.age_range} onChange={e => setFormData({ ...formData, age_range: e.target.value })}><option>18-25</option><option>26-35</option><option>36-45</option><option>46-60</option><option>60+</option></select></div>
            <div><label style={labelStyle}>LGA</label><select style={inputStyle} value={formData.lga} onChange={e => setFormData({ ...formData, lga: e.target.value })}><option>Ankpa</option><option>Omala</option><option>Olamaboro</option></select></div>
            <div><label style={labelStyle}>Ward</label><input style={inputStyle} value={formData.ward} onChange={e => setFormData({ ...formData, ward: e.target.value })} /></div>
            <div><label style={labelStyle}>PU Name</label><input style={inputStyle} value={formData.polling_unit_name} onChange={e => setFormData({ ...formData, polling_unit_name: e.target.value })} /></div>
            <div><label style={labelStyle}>Occupation</label><input style={inputStyle} value={formData.occupation} onChange={e => setFormData({ ...formData, occupation: e.target.value })} /></div>
            <div><label style={labelStyle}>Has PVC</label><select style={inputStyle} value={formData.has_pvc} onChange={e => setFormData({ ...formData, has_pvc: e.target.value })}><option>Yes</option><option>No</option></select></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 18 }}>
                <input type="checkbox" checked={formData.volunteer} onChange={e => setFormData({ ...formData, volunteer: e.target.checked })} />
                <label style={{ ...labelStyle, marginBottom: 0 }}>Volunteer</label>
            </div>
        </div>
    );

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Supporters CRM</h1>
                    <p className={styles.pageDesc}>{loading ? "Loading..." : `${totalCount.toLocaleString()} total verified supporters`}</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.exportBtn} onClick={handleExportCSV}>📥 Export CSV</button>
                    <button className={styles.addBtn} onClick={() => { setFormData(EMPTY_FORM); setShowAddModal(true); }}>+ Add Supporter</button>
                </div>
            </div>

            <div className={styles.filters}>
                <input type="text" className={styles.searchInput} placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
                <div className={styles.filterGroup}>
                    {["All", "Ankpa", "Omala", "Olamaboro"].map(lga => (
                        <button key={lga} className={`${styles.filterBtn} ${filterLGA === lga ? styles.filterActive : ""}`} onClick={() => setFilterLGA(lga)}>{lga}</button>
                    ))}
                </div>
            </div>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead><tr><th>Name</th><th>Phone</th><th>LGA</th><th>Ward</th><th>PVC</th><th>Gender</th><th>Volunteer</th><th>Date</th></tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} style={{ textAlign: "center", padding: 40 }}>Loading...</td></tr>
                        ) : supporters.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#888" }}>No supporters found.</td></tr>
                        ) : supporters.map(s => (
                            <tr key={s.id} onClick={() => { setSelectedSupporter(s); setEditMode(false); }} style={{ cursor: "pointer" }}>
                                <td className={styles.nameTd}><div className={styles.avatar}>{s.full_name.split(" ").map(n => n[0]).join("").substring(0, 2)}</div>{s.full_name}</td>
                                <td>{s.phone}</td>
                                <td><span className={styles.lgaTag}>{s.lga}</span></td>
                                <td>{s.ward}</td>
                                <td><span className={`${styles.pvcBadge} ${s.has_pvc === "Yes" ? styles.pvcYes : styles.pvcNo}`}>{s.has_pvc}</span></td>
                                <td>{s.gender}</td>
                                <td>{s.volunteer ? <span className={styles.volBadge}>Yes</span> : "—"}</td>
                                <td className={styles.dateTd}>{new Date(s.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && totalCount > 0 && (
                    <div className={styles.pagination}>
                        <span className={styles.pageInfo}>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount}</span>
                        <div className={styles.pageControls}>
                            <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                            <button className={styles.pageBtn} disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>Next →</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ══════ VIEW / EDIT MODAL ══════ */}
            {selectedSupporter && (
                <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) { setSelectedSupporter(null); setEditMode(false); } }}>
                    <div className={styles.modal}>
                        <button className={styles.modalClose} onClick={() => { setSelectedSupporter(null); setEditMode(false); }}>✕</button>

                        {editMode ? (
                            <>
                                <h2 className={styles.modalName} style={{ marginBottom: 20 }}>Edit Supporter</h2>
                                {renderFormFields()}
                                <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
                                    <button onClick={() => setEditMode(false)} style={{ padding: "10px 18px", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: "var(--admin-hover)", color: "var(--admin-text)", border: "1px solid var(--admin-border)", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
                                    <button onClick={handleEdit} disabled={saving} style={{ padding: "10px 18px", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: "#C9A227", color: "#0e3d22", border: "none", borderRadius: 6, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "💾 Save Changes"}</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.modalHeader}>
                                    <div className={styles.modalAvatar}>
                                        {selectedSupporter.photo_url ? (
                                            <Image src={selectedSupporter.photo_url} alt={selectedSupporter.full_name} fill style={{ objectFit: "cover", borderRadius: "50%" }} />
                                        ) : (
                                            <span>{selectedSupporter.full_name.split(" ").map(n => n[0]).join("").substring(0, 2)}</span>
                                        )}
                                    </div>
                                    <h2 className={styles.modalName}>{selectedSupporter.full_name}</h2>
                                    <p className={styles.modalMeta}>{selectedSupporter.ward}, {selectedSupporter.lga}</p>
                                    <div className={styles.modalActions}>
                                        {selectedSupporter.phone && <a href={`sms:${selectedSupporter.phone}`} className={styles.modalActionBtn}>📱 SMS</a>}
                                        {(selectedSupporter.whatsapp || selectedSupporter.phone) && (
                                            <a href={`https://wa.me/${(selectedSupporter.whatsapp || selectedSupporter.phone).replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className={styles.modalActionBtn}>💬 WhatsApp</a>
                                        )}
                                        {selectedSupporter.email && <a href={`mailto:${selectedSupporter.email}`} className={styles.modalActionBtn}>✉️ Email</a>}
                                    </div>
                                </div>
                                <div className={styles.modalGrid}>
                                    {[
                                        ["Phone", selectedSupporter.phone], ["WhatsApp", selectedSupporter.whatsapp || "—"],
                                        ["Email", selectedSupporter.email || "—"], ["Gender", selectedSupporter.gender],
                                        ["Age Range", selectedSupporter.age_range], ["Occupation", selectedSupporter.occupation || "—"],
                                        ["LGA", selectedSupporter.lga], ["Ward", selectedSupporter.ward],
                                        ["Polling Unit", selectedSupporter.polling_unit_name || selectedSupporter.polling_unit_code || "—"],
                                        ["Has PVC", selectedSupporter.has_pvc], ["Volunteer", selectedSupporter.volunteer ? "✅ Yes" : "No"],
                                        ["How They Heard", selectedSupporter.hear_about || "—"],
                                    ].map(([label, value], i) => (
                                        <div key={i} className={styles.modalField}><label>{label}</label><span>{value}</span></div>
                                    ))}
                                    <div className={styles.modalField} style={{ gridColumn: "1 / -1" }}><label>Registered</label><span>{new Date(selectedSupporter.created_at).toLocaleString("en-NG", { dateStyle: "long", timeStyle: "short" })}</span></div>
                                </div>
                                {/* Action Buttons */}
                                <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
                                    <button onClick={() => openEditMode(selectedSupporter)} style={{ padding: "10px 18px", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: "var(--admin-hover)", color: "var(--admin-text)", border: "1px solid var(--admin-border)", borderRadius: 6, cursor: "pointer" }}>✏️ Edit</button>
                                    {deleteConfirm === selectedSupporter.id ? (
                                        <>
                                            <span style={{ fontSize: 12, color: "#dc3545", alignSelf: "center", fontWeight: 700 }}>Are you sure?</span>
                                            <button onClick={() => handleDelete(selectedSupporter.id)} style={{ padding: "10px 18px", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: "#dc3545", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>Confirm Delete</button>
                                            <button onClick={() => setDeleteConfirm(null)} style={{ padding: "10px 18px", fontSize: 12, fontWeight: 700, background: "var(--admin-hover)", color: "var(--admin-text)", border: "1px solid var(--admin-border)", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
                                        </>
                                    ) : (
                                        <button onClick={() => setDeleteConfirm(selectedSupporter.id)} style={{ padding: "10px 18px", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: "rgba(220,53,69,0.1)", color: "#dc3545", border: "1px solid rgba(220,53,69,0.3)", borderRadius: 6, cursor: "pointer" }}>🗑️ Delete</button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ══════ ADD MODAL ══════ */}
            {showAddModal && (
                <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
                    <div className={styles.modal}>
                        <button className={styles.modalClose} onClick={() => setShowAddModal(false)}>✕</button>
                        <h2 className={styles.modalName} style={{ marginBottom: 20 }}>Add New Supporter</h2>
                        {renderFormFields()}
                        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
                            <button onClick={() => setShowAddModal(false)} style={{ padding: "10px 18px", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: "var(--admin-hover)", color: "var(--admin-text)", border: "1px solid var(--admin-border)", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
                            <button onClick={handleAdd} disabled={saving} style={{ padding: "10px 18px", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: "#C9A227", color: "#0e3d22", border: "none", borderRadius: 6, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "✅ Add Supporter"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════ DELETE STANDALONE CONFIRM ══════ */}
        </div>
    );
}
