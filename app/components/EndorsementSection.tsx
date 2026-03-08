"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabase";
import styles from "./EndorsementSection.module.css";

export default function EndorsementSection() {
    const [flyerCount, setFlyerCount] = useState(0);

    useEffect(() => {
        async function fetchCount() {
            const { count } = await supabase.from("flyer_logs").select("*", { count: "exact", head: true });
            setFlyerCount(count || 0);
        }
        fetchCount();
    }, []);

    return (
        <section id="endorse" className={styles.section} aria-labelledby="endorse-heading">
            <div className="container">
                <div className={styles.inner}>
                    <div className={styles.left}>
                        <p className="section-label" aria-hidden="true">Show Your Support</p>
                        <h2 className={styles.title} id="endorse-heading">Create Your<br />Personal <em>Endorsement<br />Flyer</em></h2>
                        <p className={styles.body}>Join hundreds of supporters across Ankpa, Omala, and Olamaboro — upload your photo, generate a personalised APC-branded flyer featuring you and Rt. Hon. Abdullahi Ibrahim Ali, and share it with your community on WhatsApp, Facebook, and Instagram.</p>
                        <div className={styles.steps}>
                            {[
                                { n: "1", text: <><strong>Upload or snap a selfie</strong> — use your phone camera or gallery image directly in your browser.</> },
                                { n: "2", text: <><strong>Choose from 6 stunning designs</strong> — bright, politically savvy templates featuring both you and Rt. Hon. Abdullahi Ibrahim Ali.</> },
                                { n: "3", text: <><strong>Download &amp; share</strong> — get your APC-branded flyer in seconds and share it everywhere.</> },
                            ].map((s) => (
                                <div key={s.n} className={styles.step}>
                                    <div className={styles.stepNum}>{s.n}</div>
                                    <p className={styles.stepText}>{s.text}</p>
                                </div>
                            ))}
                        </div>
                        <a href="/endorsement" className="btn-primary">📸 Create My Endorsement Flyer</a>
                    </div>
                    <div className={styles.right}>
                        <div className={styles.flyerMockup} role="img" aria-label="Sample endorsement flyer preview">
                            <div className={styles.flyerTop}>I Support Rt. Hon. Abdullahi Ibrahim Ali · APC</div>
                            <div className={styles.flyerPhotoArea}>
                                <div className={styles.flyerCandidateWrap}>
                                    <Image
                                        src="/images/halims-4.png"
                                        alt="Rt. Hon. Abdullahi Ibrahim Ali (Halims)"
                                        width={200}
                                        height={200}
                                        className={styles.flyerCandidateImg}
                                        style={{ objectFit: "cover", width: "100%", height: "100%", borderRadius: "50%" }}
                                    />
                                </div>
                                <div className={styles.flyerCircle}>
                                    <span className={styles.flyerCircleText}>Your<br />Photo</span>
                                </div>
                            </div>
                            <div className={styles.flyerText}>
                                <p className={styles.flyerSupport}>Your Name Here</p>
                                <p className={styles.flyerCandidate}>Endorses<br />Hon. Rt. Hon. Abdullahi Ibrahim<br />Ali (Halims)</p>
                            </div>
                            <div className={styles.flyerBottom}>APC · House of Representatives · 2027</div>
                            <div className={styles.flyerLogoBadge}>
                                <Image src="/images/apc-logo-1.png" alt="APC" width={28} height={28} style={{ objectFit: "contain" }} />
                            </div>
                        </div>
                        <div className={styles.counter} aria-live="polite">
                            <div>
                                <div className={styles.counterNum}>{flyerCount.toLocaleString()}</div>
                                <div className={styles.counterLabel}>Flyers<br />Generated</div>
                            </div>
                            <div style={{ width: 1, height: 40, background: "rgba(201,162,39,0.3)" }} />
                            <div>
                                <div className={styles.counterNum}>↑ Live</div>
                                <div className={styles.counterLabel}>&amp; Growing</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
