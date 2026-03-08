"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import s from "../dashboard.module.css";

interface Message {
    id: string;
    name: string;
    phone: string;
    email: string;
    subject: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function AdminInbox() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Message | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchMessages = async () => {
        const { data } = await supabase
            .from("messages")
            .select("*")
            .order("created_at", { ascending: false });
        if (data) {
            setMessages(data);
            setUnreadCount(data.filter(m => !m.is_read).length);
        }
        setLoading(false);
    };

    useEffect(() => { fetchMessages(); }, []);

    const toggleRead = async (msg: Message) => {
        await supabase.from("messages").update({ is_read: !msg.is_read }).eq("id", msg.id);
        fetchMessages();
        if (selected?.id === msg.id) setSelected({ ...msg, is_read: !msg.is_read });
    };

    const openMessage = async (msg: Message) => {
        setSelected(msg);
        if (!msg.is_read) {
            await supabase.from("messages").update({ is_read: true }).eq("id", msg.id);
            fetchMessages();
        }
    };

    const deleteMessage = async (id: string) => {
        if (!confirm("Delete this message?")) return;
        await supabase.from("messages").delete().eq("id", id);
        if (selected?.id === id) setSelected(null);
        fetchMessages();
    };

    if (loading) {
        return (
            <div className={s.dash}>
                <div className={s.header}>
                    <h1 className={s.pageTitle}>Inbox</h1>
                    <p className={s.pageDesc}>Loading messages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={s.dash}>
            <div className={s.header}>
                <h1 className={s.pageTitle}>
                    Inbox {unreadCount > 0 && <span style={{ background: "#C9A227", color: "#0A3020", fontSize: 12, fontWeight: 800, padding: "2px 8px", borderRadius: 10, marginLeft: 8 }}>{unreadCount} new</span>}
                </h1>
                <p className={s.pageDesc}>Messages from the contact form — {messages.length} total</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 20 }}>
                {/* Message List */}
                <div className={s.card} style={{ padding: 0, overflow: "hidden" }}>
                    {messages.length === 0 ? (
                        <p style={{ padding: 24, color: "var(--admin-text-muted)", fontSize: 14 }}>No messages yet.</p>
                    ) : (
                        messages.map(msg => (
                            <div
                                key={msg.id}
                                onClick={() => openMessage(msg)}
                                style={{
                                    padding: "14px 18px", borderBottom: "1px solid var(--admin-border)",
                                    cursor: "pointer", background: selected?.id === msg.id ? "var(--admin-border)" : "transparent",
                                    transition: "0.15s",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                    <span style={{ fontSize: 13, fontWeight: msg.is_read ? 500 : 800, color: "var(--admin-text)" }}>
                                        {!msg.is_read && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#C9A227", marginRight: 6 }} />}
                                        {msg.name}
                                    </span>
                                    <span style={{ fontSize: 10, color: "var(--admin-text-muted)" }}>{timeAgo(msg.created_at)}</span>
                                </div>
                                <p style={{ fontSize: 12, fontWeight: msg.is_read ? 400 : 700, color: "var(--admin-text)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {msg.subject || "(No subject)"}
                                </p>
                                <p style={{ fontSize: 11, color: "var(--admin-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {msg.message.slice(0, 80)}...
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Message Detail */}
                {selected && (
                    <div className={s.card} style={{ padding: 24 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--admin-text)", marginBottom: 4 }}>
                                    {selected.subject || "(No subject)"}
                                </h3>
                                <p style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                                    From <strong>{selected.name}</strong> · {new Date(selected.created_at).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--admin-text-muted)" }}>✕</button>
                        </div>

                        {/* Contact Details */}
                        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                            {selected.email && (
                                <a href={`mailto:${selected.email}`} style={{ fontSize: 12, color: "#C9A227", textDecoration: "none" }}>
                                    ✉️ {selected.email}
                                </a>
                            )}
                            {selected.phone && (
                                <a href={`tel:${selected.phone}`} style={{ fontSize: 12, color: "#1D7A50", textDecoration: "none" }}>
                                    📞 {selected.phone}
                                </a>
                            )}
                        </div>

                        {/* Message Body */}
                        <div style={{ background: "var(--admin-bg)", borderRadius: 8, padding: 16, fontSize: 14, lineHeight: 1.7, color: "var(--admin-text)", whiteSpace: "pre-wrap", marginBottom: 16 }}>
                            {selected.message}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => toggleRead(selected)} style={{ padding: "8px 16px", background: "var(--admin-border)", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", color: "var(--admin-text)" }}>
                                {selected.is_read ? "📬 Mark Unread" : "📭 Mark Read"}
                            </button>
                            {selected.email && (
                                <a href={`mailto:${selected.email}?subject=Re: ${selected.subject || "Your Message"}`} style={{ padding: "8px 16px", background: "#C9A227", color: "#0A3020", borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                                    ↩️ Reply via Email
                                </a>
                            )}
                            {selected.phone && (
                                <a href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 16px", background: "#25D366", color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                                    💬 WhatsApp
                                </a>
                            )}
                            <button onClick={() => deleteMessage(selected.id)} style={{ padding: "8px 16px", background: "#B22222", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}>
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
