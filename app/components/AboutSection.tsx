"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabase";
import styles from "./AboutSection.module.css";

const credentials = [
    { icon: "🏛️", text: "Deputy Majority Leader — House of Representatives" },
    { icon: "🎓", text: "PhD Holder · Hon. Doctorate in Legislative Affairs" },
    { icon: "⚙️", text: "Former Chairman — House Committee on Steel" },
    { icon: "🤝", text: "Philanthropist & Grassroots Mobilizer" },
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
                                src="/images/halims3.png"
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
                            <p className={styles.captionName}>Rt. Hon. (Dr.)<br />Abdullahi Ibrahim Ali</p>
                        </div>
                        <div className={styles.expBadge}>
                            <div className={styles.expNum}>20+</div>
                            <div className={styles.expLabel}>Years of Service</div>
                        </div>
                    </div>
                    <div className={styles.content}>
                        <p className="section-label" aria-hidden="true">About the Candidate</p>
                        <h2 className={`${styles.title} reveal reveal-delay-1`} id="about-heading">
                            A Leader Forged in<br /><em>Legislation & Service</em>
                        </h2>
                        <p className={`${styles.body} reveal reveal-delay-2`}>
                            Rt. Hon. (Dr.) Abdullahi Ibrahim Ali (Halims) is the current Deputy Majority Leader of the 10th National House of Representatives, representing Ankpa/Omala/Olamaboro Federal Constituency of Kogi State under the APC. A seasoned grassroots mobilizer with a PhD and an Honorary Doctorate in Legislative Affairs from Prince Abubakar Audu University.
                        </p>
                        <p className={`${styles.body} reveal reveal-delay-2`}>
                            From the Kogi State House of Assembly to Chairman of the House Committee on Steel, to his current role as a principal officer of the National Assembly — his political trajectory is a textbook example of methodical growth. Now gearing up for the <strong>Kogi East Senatorial District</strong> in 2027 under the <strong>All Progressives Congress (APC)</strong>.
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
                            <a href="/about" className="btn-outline" style={{ color: "var(--blue-deep)", borderColor: "var(--blue-deep)" }}>Read Full Bio</a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
