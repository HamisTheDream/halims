"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabase";
import styles from "./AboutSection.module.css";

const credentials = [
    { icon: "🏗️", text: "Chairman — G1 Group of Companies" },
    { icon: "🎓", text: "Development Advocate" },
    { icon: "🤝", text: "Philanthropist & Community Builder" },
    { icon: "💡", text: "Youth Empowerment & ICT Advocate" },
];

export default function AboutSection() {
    const [manifestoUrl, setManifestoUrl] = useState("#");

    useEffect(() => {
        async function fetchManifesto() {
            const { data } = await supabase
                .from("site_settings")
                .select("value")
                .eq("key", "manifesto_url")
                .single();
            if (data?.value) setManifestoUrl(data.value);
        }
        fetchManifesto();
    }, []);

    return (
        <section id="about" className={styles.section} aria-labelledby="about-heading">
            <div className="container">
                <div className={styles.grid}>
                    <div className={`${styles.photoWrap} reveal`}>
                        <div className={styles.photoMain}>
                            <Image
                                src="/images/halims-3.png"
                                alt="Rt. Hon. Abdullahi Ibrahim Ali (Halims) speaking at a community event"
                                width={500}
                                height={640}
                                className={styles.aboutPhoto}
                                style={{ objectFit: "cover", width: "100%", height: "100%" }}
                            />
                        </div>
                        <div className={styles.accent} aria-hidden="true" />
                        <div className={styles.caption}>
                            <p className={styles.captionTitle}>Your Candidate</p>
                            <p className={styles.captionName}>Hon. Rt. Hon.<br />Abdullahi Ibrahim Ali</p>
                        </div>
                        <div className={styles.expBadge}>
                            <div className={styles.expNum}>20+</div>
                            <div className={styles.expLabel}>Years of Service</div>
                        </div>
                    </div>
                    <div className={styles.content}>
                        <p className="section-label" aria-hidden="true">About the Candidate</p>
                        <h2 className={`${styles.title} reveal reveal-delay-1`} id="about-heading">
                            A Leader Forged<br />in <em>Enterprise &amp; Community</em>
                        </h2>
                        <p className={`${styles.body} reveal reveal-delay-2`}>
                            Rt. Hon. Abdullahi Ibrahim Ali (Halims) is a distinguished entrepreneur, philanthropist, and visionary leader — deeply rooted in the people and culture of Ankpa Federal Constituency. As Chairman of the G1 Group of Companies, he brings a rare combination of business acumen, grassroots connection, and visionary leadership to this race.
                        </p>
                        <p className={`${styles.body} reveal reveal-delay-2`}>
                            His unwavering commitment to youth empowerment, enterprise development, digital transformation, and sustainable community building has defined his public life — and will define his service in the House of Representatives. Running under the <strong>All Progressives Congress (APC)</strong>.
                        </p>
                        <div className={`${styles.credentials} reveal reveal-delay-3`}>
                            {credentials.map((c, i) => (
                                <div key={i} className={styles.credential}>
                                    <div className={styles.credIcon}>{c.icon}</div>
                                    <p className={styles.credText}>{c.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="reveal reveal-delay-4">
                            <a
                                href={manifestoUrl}
                                target={manifestoUrl !== "#" ? "_blank" : undefined}
                                rel="noopener noreferrer"
                                className="btn-primary"
                                style={{ marginRight: 16 }}
                                onClick={(e) => { if (manifestoUrl === "#") { e.preventDefault(); alert("Manifesto will be available soon. Check back later!"); } }}
                            >
                                Download Manifesto
                            </a>
                            <a href="/about" className="btn-outline" style={{ color: "var(--green-deep)", borderColor: "var(--green-deep)" }}>Read Full Bio</a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
