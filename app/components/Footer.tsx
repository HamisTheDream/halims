"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabase";
import styles from "./Footer.module.css";

const quickLinks = [
    { label: "About Rt. Hon. Abdullahi Ibrahim Ali", href: "/about" },
    { label: "Campaign Vision", href: "/about" },
    { label: "Endorsement Flyer", href: "/endorsement" },
    { label: "News & Updates", href: "/blog" },
    { label: "Photo Gallery", href: "/gallery" },
    { label: "Events", href: "/events" },
    { label: "Register Support", href: "/register" },
];
const lgaLinks = ["Ankpa LGA", "Omala LGA", "Olamaboro LGA", "Dekina LGA", "Bassa LGA", "Igalamela/Odolu LGA", "Ibaji LGA", "Idah LGA", "Ofu LGA"];

interface SocialLink { label: string; icon: string; key: string; }
const socialItems: SocialLink[] = [
    { label: "Facebook", icon: "f", key: "social_facebook" },
    { label: "X/Twitter", icon: "𝕏", key: "social_twitter" },
    { label: "Instagram", icon: "◻", key: "social_instagram" },
    { label: "WhatsApp", icon: "W", key: "social_whatsapp" },
    { label: "TikTok", icon: "♪", key: "social_tiktok" },
    { label: "YouTube", icon: "▶", key: "social_youtube" },
];

export default function Footer() {
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

    const phone1 = settings.contact_phone1 || "+234 XXX XXX XXXX";
    const email = settings.contact_email || "info@localhost:3000";
    const address = settings.contact_address || "Campaign Headquarters, Ankpa, Kogi State, Nigeria";
    const whatsapp = settings.contact_whatsapp || "";

    return (
        <footer className={styles.footer} role="contentinfo">
            <div className={styles.main}>
                <div className="container">
                    <div className={styles.grid}>
                        <div>
                            <div className={styles.brandRow}>
                                <Image src="/images/apc-logo.png" alt="All Progressives Congress Logo" width={48} height={48} className={styles.brandLogo} style={{ objectFit: "contain" }} />
                                <div>
                                    <p className={styles.brandName}>Rt. Hon. (Dr.) Abdullahi Ibrahim Ali (Halims)</p>
                                    <p className={styles.brandTag}>APC · Kogi East Senate · 2027</p>
                                </div>
                            </div>
                            <p className={styles.brandDesc}>Official campaign website for Rt. Hon. (Dr.) Abdullahi Ibrahim Ali (Halims) — Deputy Majority Leader of the House of Representatives, contesting under the <strong>All Progressives Congress (APC)</strong> for the Kogi East Senatorial District seat in the 2027 Nigerian General Elections.</p>
                            <div className={styles.social}>
                                {socialItems.map((s, i) => {
                                    const url = settings[s.key];
                                    if (!url) return <span key={i} className={styles.socialLink} style={{ opacity: 0.3, cursor: "default" }} aria-label={s.label}>{s.icon}</span>;
                                    return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label={s.label}>{s.icon}</a>;
                                })}
                            </div>
                        </div>
                        <div>
                            <p className={styles.colTitle}>Quick Links</p>
                            <ul className={styles.linkList}>{quickLinks.map((l, i) => <li key={i}><a href={l.href}>{l.label}</a></li>)}</ul>
                        </div>
                        <div>
                            <p className={styles.colTitle}>Kogi East LGAs</p>
                            <ul className={styles.linkList}>{lgaLinks.map((l, i) => <li key={i}><a href="#">{l}</a></li>)}</ul>
                        </div>
                        <div>
                            <p className={styles.colTitle}>Contact Campaign</p>
                            <div className={styles.contact}><span>📍</span><p>{address.split(",").slice(0, 2).join(",")}<br />{address.split(",").slice(2).join(",").trim() || "Nigeria"}</p></div>
                            <div className={styles.contact}><span>📞</span><p>{phone1}</p></div>
                            <div className={styles.contact}><span>✉️</span><p>{email}</p></div>
                            {whatsapp && <div className={styles.contact}><span>💬</span><p>{whatsapp}</p></div>}
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.bottom}>
                <div className="container">
                    <div className={styles.bottomInner}>
                        <p className={styles.copyright}>© 2027 <strong>Rt. Hon. (Dr.) Abdullahi Ibrahim Ali (Halims) Campaign</strong> · All Progressives Congress (APC). All Rights Reserved.</p>
                        <p className={styles.disclaimer}>Paid for by the Campaign Organisation of Rt. Hon. (Dr.) Abdullahi Ibrahim Ali (Halims)</p>
                        <p style={{ fontSize: "10px", marginTop: "8px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.5px" }}>
                            Designed &amp; Developed by{" "}
                            <a href="https://hamisahmed.koyeb.com" target="_blank" rel="noopener noreferrer" style={{ color: "#C9A227", fontWeight: 700, textDecoration: "none", borderBottom: "1px solid rgba(201,162,39,0.4)" }}>
                                Hamis Ahmed
                            </a>
                        </p>
                    </div>
                </div>
            </div>
            <div className={styles.greenBar} aria-hidden="true" />
        </footer>
    );
}
