"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import s from "../shared.module.css";

type CampaignEvent = {
    id: string;
    title: string;
    date: string;
    location: string;
    description: string;
    image_url: string;
    created_at: string;
};

export default function EventsAdminPage() {
    const [events, setEvents] = useState<CampaignEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const emptyForm = { title: "", date: "", location: "", description: "", image_url: "" };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchEvents(); }, []);

    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase.from("events").select("*").order("date", { ascending: true });
        if (!error && data) setEvents(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.date || !form.location) { alert("Title, Date, and Location are required."); return; }
        const payload = { title: form.title, date: new Date(form.date).toISOString(), location: form.location, description: form.description, image_url: form.image_url };

        if (editingId) {
            const { error } = await supabase.from("events").update(payload).eq("id", editingId);
            if (error) { alert("Failed to update event."); return; }
        } else {
            const { error } = await supabase.from("events").insert([payload]);
            if (error) { alert("Failed to create event."); return; }
        }
        cancelForm();
        fetchEvents();
    };

    const handleEdit = (ev: CampaignEvent) => {
        setEditingId(ev.id);
        setIsCreating(true);
        setForm({ title: ev.title, date: ev.date ? new Date(ev.date).toISOString().slice(0, 16) : "", location: ev.location || "", description: ev.description || "", image_url: ev.image_url || "" });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this event? This cannot be undone.")) return;
        await supabase.from("events").delete().eq("id", id);
        fetchEvents();
    };

    const cancelForm = () => { setIsCreating(false); setEditingId(null); setForm(emptyForm); };

    return (
        <div className={s.adminPage}>
            <div className={s.pageHeader}>
                <div>
                    <h1 className={s.pageTitle}>Events Management</h1>
                    <p className={s.pageDesc}>{events.length} events across all LGAs</p>
                </div>
                <button className={s.addButton} onClick={() => { if (isCreating) cancelForm(); else setIsCreating(true); }}>
                    {isCreating ? "Cancel" : "+ Create Event"}
                </button>
            </div>

            {isCreating && (
                <div className={s.card} style={{ marginBottom: 24 }}>
                    <div className={s.cardHeader} style={{ padding: "20px 24px 0" }}>{editingId ? "Edit Event" : "New Event"}</div>
                    <form className={s.cardPadded} onSubmit={handleSubmit}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                            <div><label className={s.formLabel}>Title *</label><input className={s.formInput} placeholder="e.g. Ankpa Youth Summit" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                            <div><label className={s.formLabel}>Date & Time *</label><input type="datetime-local" className={s.formInput} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                            <div><label className={s.formLabel}>Location *</label><input className={s.formInput} placeholder="e.g. Ankpa Town Hall" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required /></div>
                            <div><label className={s.formLabel}>Image URL</label><input type="url" className={s.formInput} placeholder="https://..." value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} /></div>
                        </div>
                        <div style={{ marginBottom: 20 }}><label className={s.formLabel}>Description</label><textarea className={s.formTextarea} rows={3} placeholder="Details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button type="button" className={s.outlineButton} onClick={cancelForm}>Cancel</button>
                            <button type="submit" className={s.addButton}>{editingId ? "Update Event" : "Save Event"}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className={s.card}>
                <table className={s.table}>
                    <thead><tr><th className={s.th}>Title</th><th className={s.th}>Date</th><th className={s.th}>Location</th><th className={s.th}>Status</th><th className={s.th}>Actions</th></tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ textAlign: "center", padding: 40 }}>Loading...</td></tr>
                        ) : events.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#888" }}>No events yet.</td></tr>
                        ) : events.map(ev => {
                            const isPast = new Date(ev.date) < new Date();
                            return (
                                <tr key={ev.id}>
                                    <td className={s.tdBold}>{ev.title}</td>
                                    <td className={s.td} style={{ color: "var(--admin-gold)", fontWeight: 600 }}>{new Date(ev.date).toLocaleString("en-NG", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                                    <td className={s.td}>📍 {ev.location}</td>
                                    <td className={s.td}><span className={isPast ? s.tagMuted : s.tagGreen}>{isPast ? "Completed" : "Upcoming"}</span></td>
                                    <td className={s.td}>
                                        <button className={s.outlineButton} style={{ marginRight: 6, fontSize: 11, padding: "4px 10px" }} onClick={() => handleEdit(ev)}>Edit</button>
                                        <button className={s.deleteBtn} onClick={() => handleDelete(ev.id)}>Delete</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
