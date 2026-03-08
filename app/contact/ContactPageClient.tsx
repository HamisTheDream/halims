"use client";
import { useState, useEffect } from "react";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./contact.module.css";
import { supabase } from "../lib/supabase";

export default function ContactPageClient() {
    const revealRef = useRevealOnScroll();
    const [sent, setSent] = useState(false);
    const [settings, setSettings] = useState<Record<string, string>>({});

    useEffect(() => {
        async function load() {
            const { data } = await supabase.from("site_settings").select("key, value");
            if (data) {
                const map: Record<string, string> = {};
                for (const item of data) map[item.key] = item.value || "";
                setSettings(map);
            }
        }
        load();
    }, []);

    const contactInfo = [
        { icon: "📍", title: "Campaign HQ", lines: [(settings.contact_address || "Ankpa, Kogi State, Nigeria").split(",").slice(0, 2).join(","), (settings.contact_address || "Ankpa, Kogi State, Nigeria").split(",").slice(2).join(",").trim() || "Nigeria"] },
        { icon: "📞", title: "Phone", lines: [settings.contact_phone1 || "+234 XXX XXX XXXX", settings.contact_phone2 || ""].filter(Boolean) },
        { icon: "✉️", title: "Email", lines: [settings.contact_email || "info@localhost:3000"] },
        { icon: "💬", title: "WhatsApp", lines: [settings.contact_whatsapp || "+234 XXX XXX XXXX"] },
    ];

    const socials = [
        { name: "Facebook", icon: "f", url: settings.social_facebook || "#" },
        { name: "Twitter/X", icon: "𝕏", url: settings.social_twitter || "#" },
        { name: "Instagram", icon: "◻", url: settings.social_instagram || "#" },
        { name: "TikTok", icon: "♪", url: settings.social_tiktok || "#" },
        { name: "YouTube", icon: "▶", url: settings.social_youtube || "#" },
    ];

    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        subject: "",
        message: "",
        website_url: "" // Honeypot
    });
    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Honeypot check (anti-bot)
        if (form.website_url !== "") {
            // Silently resolve for bots to waste their time and not tip them off
            setSent(true);
            return;
        }

        setStatus("loading");

        // 2. Insert into DB
        const { error } = await supabase.from("messages").insert([{
            name: form.name,
            phone: form.phone,
            email: form.email,
            subject: form.subject,
            message: form.message
        }]);

        if (error) {
            console.error("Message error:", error);
            setErrorMsg("Failed to send your message. Please try again later.");
            setStatus("error");
        } else {
            setSent(true);
            setStatus("idle");
            setForm({ name: "", phone: "", email: "", subject: "", message: "", website_url: "" });
        }
    };

    return (
        <div ref={revealRef}>
            <Navbar />

            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <p className={styles.heroEyebrow}>Get in Touch</p>
                    <h1 className={styles.heroTitle}>Contact the<br /><em>Campaign</em></h1>
                    <p className={styles.heroDesc}>Have a question, suggestion, or want to collaborate? We&apos;d love to hear from you.</p>
                </div>
            </section>

            <section className={styles.contactSection}>
                <div className="container">
                    <div className={styles.grid}>
                        {/* Contact Info */}
                        <div className={styles.infoCol}>
                            <div className={`${styles.infoCards} reveal`}>
                                {contactInfo.map((c, i) => (
                                    <div key={i} className={styles.infoCard}>
                                        <span className={styles.infoIcon}>{c.icon}</span>
                                        <div>
                                            <h3 className={styles.infoTitle}>{c.title}</h3>
                                            {c.lines.map((l, j) => <p key={j} className={styles.infoLine}>{l}</p>)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={`${styles.socialCard} reveal reveal-delay-2`}>
                                <h3 className={styles.socialTitle}>Follow the Campaign</h3>
                                <div className={styles.socialGrid}>
                                    {socials.map((s, i) => (
                                        <a key={i} href={s.url} className={styles.socialLink}>
                                            <span className={styles.socialIcon}>{s.icon}</span>
                                            <span className={styles.socialName}>{s.name}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className={`${styles.formCard} reveal reveal-delay-1`}>
                            {sent ? (
                                <div className={styles.sentMsg}>
                                    <span style={{ fontSize: 48 }}>✅</span>
                                    <h3 className={styles.sentTitle}>Message Sent!</h3>
                                    <p className={styles.sentDesc}>Thank you for reaching out. We&apos;ll get back to you soon.</p>
                                    <button className="btn-primary" onClick={() => setSent(false)}>Send Another Message</button>
                                </div>
                            ) : (
                                <>
                                    <h2 className={styles.formTitle}>Send a Message</h2>
                                    <p className={styles.formSubtitle}>We typically respond within 24 hours.</p>

                                    {status === "error" && (
                                        <div style={{ padding: "12px", background: "rgba(178, 34, 34, 0.1)", color: "#B22222", borderRadius: "6px", marginBottom: "20px", fontSize: "14px" }}>
                                            {errorMsg}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className={styles.form}>
                                        {/* HONEYPOT FIELD (Hidden from real users, bots will try to fill it) */}
                                        <div style={{ display: 'none' }} aria-hidden="true">
                                            <label>Website URL</label>
                                            <input
                                                type="text"
                                                name="website_url"
                                                tabIndex={-1}
                                                autoComplete="off"
                                                value={form.website_url}
                                                onChange={e => setForm({ ...form, website_url: e.target.value })}
                                            />
                                        </div>

                                        <div className={styles.fieldRow}>
                                            <div className={styles.field}>
                                                <label className={styles.label}>Full Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className={styles.input}
                                                    placeholder="Your name"
                                                    value={form.name}
                                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                                />
                                            </div>
                                            <div className={styles.field}>
                                                <label className={styles.label}>Phone Number</label>
                                                <input
                                                    type="tel"
                                                    className={styles.input}
                                                    placeholder="+234 xxx xxx xxxx"
                                                    value={form.phone}
                                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className={styles.field} style={{ marginBottom: 20 }}>
                                            <label className={styles.label}>Email Address *</label>
                                            <input
                                                type="email"
                                                required
                                                className={styles.input}
                                                placeholder="your@email.com"
                                                value={form.email}
                                                onChange={e => setForm({ ...form, email: e.target.value })}
                                            />
                                        </div>

                                        <div className={styles.field} style={{ marginBottom: 20 }}>
                                            <label className={styles.label}>Subject *</label>
                                            <input
                                                type="text"
                                                required
                                                className={styles.input}
                                                placeholder="What is this about?"
                                                value={form.subject}
                                                onChange={e => setForm({ ...form, subject: e.target.value })}
                                            />
                                        </div>

                                        <div className={styles.field} style={{ marginBottom: 28 }}>
                                            <label className={styles.label}>Message *</label>
                                            <textarea
                                                required
                                                className={styles.textarea}
                                                placeholder="Write your message here..."
                                                rows={5}
                                                value={form.message}
                                                onChange={e => setForm({ ...form, message: e.target.value })}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className={`btn-primary ${styles.submitBtn}`}
                                            disabled={status === "loading"}
                                        >
                                            {status === "loading" ? "Sending..." : "📨 Send Message"}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
