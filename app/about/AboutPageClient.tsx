"use client";
import { useState, useEffect } from "react";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import { supabase } from "../lib/supabase";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./about.module.css";

const defaultTimeline = [
    { year: "1964", title: "Birth & Early Life", desc: "Born on August 18, 1964 in Kogi State, raised with a deep connection to the eastern flank of the state (Kogi East). This grounded upbringing heavily influenced his indigenous politics approach — a leadership style characterized by profound accessibility and an intimate understanding of his people's socio-economic realities." },
    { year: "Education", title: "Academic Foundation & PhD", desc: "Holds a Doctor of Philosophy (PhD) degree, showcasing a rigorous intellectual foundation. Recently conferred with an Honorary Doctorate Degree in Legislative Affairs and Activities by Prince Abubakar Audu University (PAAU), Anyigba — adding dual academic prestige to his policy-making credentials." },
    { year: "2007–2011", title: "Kogi State House of Assembly", desc: "Cut his legislative teeth representing the Ankpa I constituency in the Kogi State House of Assembly. During this four-year tenure, he learned the intricacies of lawmaking, constituent advocacy, and local political maneuvering, earning the trust of his immediate community." },
    { year: "2013–2014", title: "Chairman, Kogi State Water Board", desc: "Transitioning into an executive administrative role, he served as Chairman of the Kogi State Water Board — testing his ability to manage critical state infrastructure and deliver essential services to the populace, further expanding his administrative capacity." },
    { year: "2019–2023", title: "9th Assembly — Chairman, Committee on Steel", desc: "Elected to represent Ankpa/Omala/Olamaboro Federal Constituency. Quickly distinguished himself and was appointed Chairman of the House Committee on Steel — aggressively championing the revitalization of Nigeria's iron and solid minerals sector and fighting for the operationalization of the Ajaokuta Steel Company." },
    { year: "2023–Present", title: "10th Assembly — Deputy Majority Leader", desc: "Returning as a ranking member after a successful re-election, his political capital peaked. In July 2023, the Speaker unveiled him as the Deputy Majority Leader of the House — a principal officer role at the very nexus of national policy formulation and legislative agenda-setting." },
    { year: "Philanthropy", title: "Grassroots Empowerment & Human Capital", desc: "Routinely pays JAMB, WAEC, and NECO fees for thousands of indigent students. Secured permanent employment for hundreds in the Nigeria Police Force, Correctional Service, Federal University Lokoja, and Ajaokuta Steel Company. Partners with NDE and National Productivity Centre for skills acquisition programmes." },
    { year: "2027", title: "Kogi East Senatorial Ambition", desc: "Armed with an impressive resume — from state legislator, to Water Board Chairman, to Deputy Majority Leader, and now holding dual doctorate honors — Dr. Halims is strategically gearing up to contest the Kogi East Senatorial District election in 2027 under the APC." },
];

const defaultValues = [
    { icon: "🎯", title: "Integrity", desc: "Transparent leadership rooted in honesty, accountability, and a proven track record of delivering on promises to every citizen." },
    { icon: "🤝", title: "Grassroots Access", desc: "Every ward, every polling unit, every voice across all 9 LGAs of Kogi East matters — a leadership style characterized by profound accessibility." },
    { icon: "🏛️", title: "Legislative Excellence", desc: "From State Assembly to Deputy Majority Leader — a methodical rise proving mastery of lawmaking, policy formulation, and constituent advocacy." },
    { icon: "💡", title: "Human Capital Development", desc: "Paying exam fees for thousands, securing federal jobs for hundreds, and empowering youth and women with skills acquisition and startup capital." },
];

// Default bio paragraphs
const defaultBio = `<p>Rt. Hon. (Dr.) Abdullahi Ibrahim Ali Halims is a formidable Nigerian politician, seasoned grassroots mobilizer, and the current Deputy Majority Leader of the 10th National House of Representatives. Representing the Ankpa/Omala/Olamaboro Federal Constituency of Kogi State under the All Progressives Congress (APC), his political trajectory is a textbook example of steady, methodical growth from state-level representation to national leadership.</p>
<p>Born on August 18, 1964, in Kogi State, Dr. Halims was raised with a deep connection to the eastern flank of the state (Kogi East). Academically, he holds a Doctor of Philosophy (PhD), and was recently conferred with an Honorary Doctorate Degree in Legislative Affairs and Activities by Prince Abubakar Audu University (PAAU), Anyigba — adding significant weight to his policy-making credentials.</p>
<p>Before stepping onto the national stage, Dr. Halims built a solid political foundation within Kogi State. He served in the Kogi State House of Assembly (2007–2011) representing Ankpa I constituency, learning the intricacies of lawmaking and earning the trust of his community. He then served as Chairman of the Kogi State Water Board (2013–2014), managing critical state infrastructure and delivering essential services.</p>
<p>His successful state-level tenures propelled him to the National Assembly. In the 9th Assembly (2019–2023), he was appointed Chairman of the House Committee on Steel, aggressively championing the revitalization of Nigeria's iron and solid minerals sector and the operationalization of the Ajaokuta Steel Company. In the 10th Assembly (2023–Present), he was unveiled as the Deputy Majority Leader — a principal officer role at the very nexus of national policy formulation and legislative agenda-setting.</p>
<p>Dr. Halims operates on the philosophy that political power must translate into human capital development. He routinely pays JAMB, WAEC, and NECO examination fees for thousands of indigent students. He has secured permanent employment for hundreds of constituents in major federal parastatals including the Nigeria Police Force, Correctional Service, Federal University Lokoja, and Ajaokuta Steel Company. He frequently partners with the National Directorate of Employment (NDE) and the National Productivity Centre to facilitate skills acquisition and empower youth and women with startup capital.</p>`;

export default function AboutPageClient() {
    const revealRef = useRevealOnScroll();
    const [heroTitle, setHeroTitle] = useState("Rt. Hon. (Dr.)\nAbdullahi Ibrahim Ali (Halims)");
    const [heroSubtitle, setHeroSubtitle] = useState("Deputy Majority Leader · PhD · Seasoned Legislator");
    const [heroDesc, setHeroDesc] = useState("A formidable Nigerian politician and the current Deputy Majority Leader of the House of Representatives — bringing 17+ years of proven legislative leadership to the Kogi East Senatorial race in 2027.");
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
                                    src="/images/halims3.png"
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
                            <h2 className={`${styles.bioTitle} reveal reveal-delay-1`}>A Career Dedicated to<br /><em>Legislation & Service</em></h2>
                            <div className={`${styles.bioText} reveal reveal-delay-2`} dangerouslySetInnerHTML={{ __html: bio }} />
                            <div className={`${styles.bioActions} reveal reveal-delay-3`}>
                                <a href={manifestoUrl} target={manifestoUrl !== "#" ? "_blank" : undefined} rel="noopener noreferrer" className="btn-primary">📄 Download Full Manifesto</a>
                                <a href="#timeline" className="btn-outline" style={{ color: "var(--blue-deep)", borderColor: "var(--blue-deep)" }}>View Journey →</a>
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
                        <p className={styles.ctaDesc}>Be part of the transformation. Register your support and help us send a proven legislator, grassroots mobilizer, and principal officer to the Nigerian Senate for Kogi East.</p>
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
