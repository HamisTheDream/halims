"use client";
import { useEffect, useRef } from "react";
import styles from "./ConstituencySection.module.css";

const lgas = [
    { num: "01", name: "Ankpa LGA", wards: "13 Wards", pus: "292 Polling Units", hq: "Ankpa Township", progress: 85 },
    { num: "02", name: "Omala LGA", wards: "11 Wards", pus: "148 Polling Units", hq: "Abejukolo", progress: 70 },
    { num: "03", name: "Olamaboro LGA", wards: "10 Wards", pus: "174 Polling Units", hq: "Okpo", progress: 78 },
];

export default function ConstituencySection() {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                el.querySelectorAll<HTMLElement>("[data-width]").forEach((fill: HTMLElement) => {
                    fill.style.width = fill.dataset.width + "%";
                });
            }
        }, { threshold: 0.3 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <section id="constituency" className={styles.section} aria-labelledby="constituency-heading">
            <div className="container">
                <header className={styles.header}>
                    <div>
                        <p className="section-label" aria-hidden="true">Our Constituency</p>
                        <h2 className={`${styles.title} reveal`} id="constituency-heading">Three LGAs.<br /><em>One Voice.</em> One Mission.</h2>
                    </div>
                    <p className={`${styles.desc} reveal reveal-delay-2`}>
                        The Ankpa Federal Constituency encompasses three Local Government Areas — united in culture, heritage, and the shared aspiration for better governance, prosperity, and representation in Abuja.
                    </p>
                </header>
                <div className={styles.cards} ref={ref}>
                    {lgas.map((l, i) => (
                        <div key={i} className={`${styles.card} reveal reveal-delay-${i + 1}`}>
                            <span className={styles.cardNum} aria-hidden="true">{l.num}</span>
                            <h3 className={styles.cardName}>{l.name}</h3>
                            <div className={styles.meta}>
                                <div className={styles.metaItem}><span className={styles.dot} />{l.wards}</div>
                                <div className={styles.metaItem}><span className={styles.dot} />{l.pus}</div>
                                <div className={styles.metaItem}><span className={styles.dot} />{l.hq}</div>
                            </div>
                            <div className={styles.progressBar}><div className={styles.progressFill} data-width={l.progress} /></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
