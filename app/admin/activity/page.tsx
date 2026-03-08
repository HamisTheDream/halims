"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

interface Activity {
    id: string;
    admin_name: string;
    action: string;
    details: string | null;
    created_at: string;
}

const ACTION_ICONS: Record<string, string> = {
    login: "🔐",
    logout: "🚪",
    delete_supporter: "🗑️",
    broadcast_sent: "📢",
    settings_update: "⚙️",
    agent_created: "👤",
    result_submitted: "🗳️",
    export: "📄",
    default: "📋",
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function AdminActivityPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from("admin_activity_log")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100)
            .then(({ data }) => {
                setActivities(data || []);
                setLoading(false);
            });
    }, []);

    const cardStyle: React.CSSProperties = {
        background: "var(--admin-card)",
        border: "1px solid var(--admin-border)",
        borderRadius: 16,
        padding: 24,
    };

    const itemStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "14px 0",
        borderBottom: "1px solid var(--admin-border)",
    };

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--admin-text)" }}>Activity Log</h1>
                <p style={{ fontSize: 14, color: "var(--admin-text-muted)", marginTop: 4 }}>
                    Track all admin actions across the platform
                </p>
            </div>

            <div style={cardStyle}>
                {loading ? (
                    <p style={{ color: "var(--admin-text-muted)", padding: 20, textAlign: "center" }}>Loading activity log...</p>
                ) : activities.length === 0 ? (
                    <p style={{ color: "var(--admin-text-muted)", padding: 20, textAlign: "center" }}>No activity recorded yet.</p>
                ) : (
                    activities.map((a) => {
                        const icon = ACTION_ICONS[a.action] || ACTION_ICONS.default;
                        return (
                            <div key={a.id} style={itemStyle}>
                                <span style={{ fontSize: 22, marginTop: 2 }}>{icon}</span>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--admin-text)" }}>
                                        <span style={{ color: "var(--apc-red)" }}>{a.admin_name}</span> — {a.action.replace(/_/g, " ")}
                                    </p>
                                    {a.details && (
                                        <p style={{ fontSize: 12, color: "var(--admin-text-muted)", marginTop: 2 }}>{a.details}</p>
                                    )}
                                </div>
                                <span style={{ fontSize: 11, color: "var(--admin-text-muted)", whiteSpace: "nowrap" }}>{timeAgo(a.created_at)}</span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
