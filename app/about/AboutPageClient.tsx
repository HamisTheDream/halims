"use client";
import { useState, useEffect } from "react";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import { supabase } from "../lib/supabase";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./about.module.css";

const defaultTimeline = [
    { year: "Early Years", title: "Birth & Upbringing", desc: "Born in Imane, Olamaboro LGA, Kogi State, into the family of Mr. and Mrs. Yusuf Mai-Photo Ali. With paternal roots in Imane and maternal heritage from Angwa Ankpa, his upbringing was deeply shaped by values of discipline, service, and cultural pride." },
    { year: "Primary", title: "Early Education", desc: "Began with early Islamic education in Kano before proceeding to Imane Central School for his primary education, laying a strong foundation in faith and learning." },
    { year: "Secondary", title: "St. Charles College & ICGS", desc: "Attended Saint Charles College, Ankpa and later Imane Community Grammar School (ICGS), where he distinguished himself both academically and socially." },
    { year: "University", title: "Kogi State University — Political Science", desc: "Driven by a passion for leadership and governance, he earned a degree in Political Science from Kogi State University, where he was actively involved in student leadership and organizational development." },
    { year: "NYSC & Banking", title: "Financial Sector Career", desc: "After completing NYSC, began his professional career in the financial sector, serving at Bank PHB and later Fortis Microfinance Bank, gaining critical experience in banking operations, financial management, and investment strategy." },
    { year: "Enterprise", title: "G1 Group of Companies", desc: "With a bold entrepreneurial spirit, ventured into mining, livestock management, automobile trading, real estate, and property development. These ventures evolved into the reputable G1 Group of Companies, where he serves as Chairman — creating employment, stimulating local economies, and contributing to Nigeria's business landscape." },
    { year: "Philanthropy", title: "Community Impact & Recognition", desc: "Widely respected for deep commitment to humanitarian service: fencing and remodelling ICGS, youth computer training for 100+ youths, sponsoring WAEC fees, constructing an ultramodern hospital, building a Civil Defence office, and establishing the Skill Acquisition Centre in Okpo. Appointed Patron of the Arewa Grassroots Leaders Assembly (AGLA)." },
    { year: "2027", title: "Running for House of Representatives", desc: "Formally declared his candidacy to represent the people of Ankpa/Omala/Olamaboro at the National Assembly under the All Progressives Congress (APC) — a vision centered on youth empowerment, digital transformation, and sustainable community building." },
];

const defaultValues = [
    { icon: "🎯", title: "Integrity", desc: "Transparent leadership rooted in honesty and accountability to every citizen." },
    { icon: "🤝", title: "Inclusivity", desc: "Every ward, every polling unit, every voice matters in the new Ankpa Federal Constituency." },
    { icon: "💡", title: "Innovation", desc: "Leveraging modern solutions, digital transformation, and technology to solve age-old constituency challenges." },
    { icon: "🏗️", title: "Enterprise", desc: "A proven entrepreneur building businesses that create jobs, stimulate economies, and empower communities." },
];

// Default bio paragraphs
const defaultBio = `<p>Rt. Hon. Abdullahi Ibrahim Ali, fondly known as G1, is a distinguished Nigerian entrepreneur, philanthropist, and visionary leader whose life reflects resilience, enterprise, and an unwavering commitment to community advancement. Born in Imane, Olamaboro Local Government Area of Kogi State, he hails from the family of Mr. and Mrs. Yusuf Mai-Photo Ali, with paternal roots in Imane and maternal heritage from Angwa Ankpa — a background that deeply shaped his values of discipline, service, and cultural pride.</p>
<p>His formative years were marked by a strong foundation in faith and learning. He began with early Islamic education in Kano before proceeding to Imane Central School. For secondary education, he attended Saint Charles College, Ankpa and later Imane Community Grammar School (ICGS). Driven by a passion for leadership and governance, he earned a degree in Political Science from Kogi State University, where he was actively involved in student leadership and organizational development.</p>
<p>After completing his NYSC, Rt. Hon. Ali began his professional career in the financial sector, serving at Bank PHB and later Fortis Microfinance Bank. With a bold entrepreneurial spirit, he ventured into mining, livestock management, automobile trading, real estate, and property development — building the reputable G1 Group of Companies, where he serves as Chairman. Under his visionary leadership, G1 Group has grown into a diversified conglomerate creating employment opportunities and stimulating local economies.</p>
<p>Beyond business, Rt. Hon. Ali is widely respected for his deep commitment to humanitarian service and grassroots development. His impactful initiatives include: fencing and remodelling of ICGS, empowering over 100 youths through computer training, sponsoring WAEC registration fees for indigent students, consistent support to widows and vulnerable families, construction of an ultramodern hospital, building a modern Civil Defence office, and establishing the Skill Acquisition Centre in Okpo. Through the Life Seed Ultimate ICT and Career Development Summer Bootcamp 2025, he aims to equip 250 Nigerian youths with in-demand tech skills. In recognition of his dedication, he was appointed Patron of the Arewa Grassroots Leaders Assembly (AGLA).</p>`;

export default function AboutPageClient() {
    const revealRef = useRevealOnScroll();
    const [heroTitle, setHeroTitle] = useState("Hon. Rt. Hon.\nAbdullahi Ibrahim Ali (Halims)");
    const [heroSubtitle, setHeroSubtitle] = useState("Entrepreneur · Philanthropist · Visionary Leader");
    const [heroDesc, setHeroDesc] = useState("A distinguished entrepreneur, philanthropist, and community champion — driven by an unwavering commitment to transform Ankpa Federal Constituency through youth empowerment, enterprise development, and sustainable community building.");
    const [bio, setBio] = useState(defaultBio);
    const [manifestoUrl, setManifestoUrl] = useState("#");

    useEffect(() => {
        async function loadSettings() {
            const { data } = await supabase.from("site_settings").select("key, value");
            if (data) {
                for (const item of data) {
                    if (item.key === "about_hero_title" && item.value) setHeroTitle(item.value);
                    if (item.key === "about_hero_subtitle" && item.value) setHeroSubtitle(item.value);
                    if (item.key === "about_hero_desc" && item.value) setHeroDesc(item.value);
                    if (item.key === "about_bio" && item.value) setBio(item.value);
                    if (item.key === "manifesto_url" && item.value) setManifestoUrl(item.value);
                }
            }
        }
        loadSettings();
    }, []);

    return (
        <div ref={revealRef}>
            <Navbar />

            {/* Hero Banner */}
            <section className={styles.hero}>
                <div className={styles.heroOverlay} />
                <div className={styles.heroContent}>
                    <p className={styles.heroEyebrow}>About the Candidate</p>
                    <h1 className={styles.heroTitle} dangerouslySetInnerHTML={{ __html: heroTitle.replace("\n", "<br /><em>") + (heroTitle.includes("\n") ? "</em>" : "") }} />
                    <p className={styles.heroSubtitle}>{heroSubtitle}</p>
                    <div className={styles.heroDivider} />
                    <p className={styles.heroDesc}>{heroDesc}</p>
                </div>
            </section>

            {/* Bio Section */}
            <section className={styles.bioSection}>
                <div className="container">
                    <div className={styles.bioGrid}>
                        <div className={`${styles.bioPhoto} reveal`}>
                            <div className={styles.bioPhotoInner}>
                                <Image
                                    src="/images/halims-3.png"
                                    alt="Rt. Hon. Abdullahi Ibrahim Ali (Halims)"
                                    width={500}
                                    height={640}
                                    style={{ objectFit: "cover", width: "100%", height: "100%", borderRadius: "inherit" }}
                                    priority
                                />
                            </div>
                            <div className={styles.bioPhotoAccent} />
                            <div className={styles.bioPhotoTag}>
                                <span className={styles.tagNum}>20+</span>
                                <span className={styles.tagLabel}>Years of Dedicated Service</span>
                            </div>
                        </div>
                        <div className={styles.bioContent}>
                            <p className="section-label reveal">The Man Behind the Mission</p>
                            <h2 className={`${styles.bioTitle} reveal reveal-delay-1`}>A Life Dedicated to<br /><em>Service &amp; Healing</em></h2>
                            <div className={`${styles.bioText} reveal reveal-delay-2`} dangerouslySetInnerHTML={{ __html: bio }} />
                            <div className={`${styles.bioActions} reveal reveal-delay-3`}>
                                <a href={manifestoUrl} target={manifestoUrl !== "#" ? "_blank" : undefined} rel="noopener noreferrer" className="btn-primary">📄 Download Full Manifesto</a>
                                <a href="#timeline" className="btn-outline" style={{ color: "var(--green-deep)", borderColor: "var(--green-deep)" }}>View Journey →</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className={styles.valuesSection}>
                <div className="container">
                    <div className={`${styles.valuesHeader} reveal`}>
                        <p className="section-label" style={{ justifyContent: "center" }}>Core Values</p>
                        <h2 className={styles.valuesTitle}>What I <em>Stand For</em></h2>
                    </div>
                    <div className={styles.valuesGrid}>
                        {defaultValues.map((v, i) => (
                            <div key={i} className={`${styles.valueCard} reveal reveal-delay-${i + 1}`}>
                                <div className={styles.valueIcon}>{v.icon}</div>
                                <h3 className={styles.valueTitle}>{v.title}</h3>
                                <p className={styles.valueDesc}>{v.desc}</p>
                                <div className={styles.valueBar} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline Section */}
            <section id="timeline" className={styles.timelineSection}>
                <div className="container">
                    <div className={`${styles.timelineHeader} reveal`}>
                        <p className="section-label" style={{ justifyContent: "center" }}>The Journey</p>
                        <h2 className={styles.timelineTitle}>A Path Forged in<br /><em>Purpose &amp; Service</em></h2>
                    </div>
                    <div className={styles.timeline}>
                        {defaultTimeline.map((t, i) => (
                            <div key={i} className={`${styles.timelineItem} ${i % 2 === 1 ? styles.timelineRight : ""} reveal`}>
                                <div className={styles.timelineDot} />
                                <div className={styles.timelineCard}>
                                    <span className={styles.timelineYear}>{t.year}</span>
                                    <h3 className={styles.timelineItemTitle}>{t.title}</h3>
                                    <p className={styles.timelineDesc}>{t.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={styles.ctaSection}>
                <div className="container">
                    <div className={`${styles.ctaInner} reveal`}>
                        <h2 className={styles.ctaTitle}>Ready to Join the Movement?</h2>
                        <p className={styles.ctaDesc}>Be part of the transformation. Register your support and help us build a healthier, stronger, more prosperous Ankpa Federal Constituency.</p>
                        <div className={styles.ctaActions}>
                            <a href="/register" className="btn-dark">✍️ Register Your Support</a>
                            <a href="/endorsement" className="btn-ghost-dark">📸 Create Endorsement Flyer</a>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
