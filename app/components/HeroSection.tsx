"use client";
import Image from "next/image";
import { useAnimatedCounter } from "../hooks/useAnimatedCounter";
import CountdownTimer from "./CountdownTimer";
import styles from "./HeroSection.module.css";

export default function HeroSection() {
    const { ref: counterRef, count } = useAnimatedCounter(2847);

    return (
        <section className={styles.hero} aria-labelledby="hero-heading">
            <div className={styles.gridPattern} aria-hidden="true" />

            {/* LEFT */}
            <div className={styles.left}>
                <div className={styles.eyebrow}>
                    <span className={styles.eyebrowDot} />
                    Official Campaign · Kogi East Senatorial District · Kogi State
                </div>
                <h1 className={styles.title} id="hero-heading">
                    Rt. Hon.<br />Abdullahi Ibrahim<em>Ali (Halims)</em>
                </h1>
                <p className={styles.constituency}>
                    Halims &nbsp;·&nbsp; Kogi East Senate &nbsp;·&nbsp; 2027
                </p>
                <p className={styles.desc}>
                    A distinguished entrepreneur, philanthropist, and visionary leader — bringing enterprise, integrity, and genuine passion for the people of Kogi East to the Nigerian Senate. Together, we build a stronger, more prosperous Kogi East.
                </p>
                <div className={styles.actions}>
                    <a href="/register" className="btn-primary">★ Register Your Support</a>
                    <a href="/endorsement" className="btn-outline">Get Endorsement Flyer</a>
                </div>
                <div className={styles.stats} ref={counterRef}>
                    <div><div className={styles.statNum}>{count.toLocaleString()}</div><div className={styles.statLabel}>Supporters<br />Registered</div></div>
                    <div><div className={styles.statNum}>9</div><div className={styles.statLabel}>LGAs<br />Covered</div></div>
                    <div><div className={styles.statNum}>34</div><div className={styles.statLabel}>Wards<br />Reached</div></div>
                    <div><div className={styles.statNum}>614</div><div className={styles.statLabel}>Polling<br />Units</div></div>
                </div>
                <CountdownTimer />
            </div>

            {/* RIGHT */}
            <div className={styles.right}>
                <div className={styles.photoContainer}>
                    <div className={styles.photoMain}>
                        <Image
                            src="/images/halims2.png"
                            alt="Rt. Hon. Abdullahi Ibrahim Ali (Halims)"
                            width={480}
                            height={600}
                            className={styles.candidatePhoto}
                            priority
                            style={{ objectFit: "cover", width: "100%", height: "100%" }}
                        />
                    </div>
                    <div className={styles.photoFrame} aria-hidden="true" />
                    <div className={styles.badge} aria-label="2027 Campaign badge" role="img">
                        <div className={styles.badgeInner}>
                            <span className={styles.badgeYear}>2027</span>
                            <span className={styles.badgeLabel}>Vote<br />Halims</span>
                        </div>
                    </div>
                    <div className={styles.partyBadge} aria-label="Party information">
                        <div className={styles.partyLogoSlot}>
                            <Image src="/images/apc-logo.png" alt="APC Logo" width={36} height={36} style={{ objectFit: "contain" }} />
                        </div>
                        <div className={styles.partyNameArea}>
                            <span className={styles.partyNameLabel}>Running under</span>
                            <span className={styles.partyNameValue}>All Progressives Congress</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className={styles.scrollIndicator} aria-hidden="true">
                <div className={styles.scrollLine} />
                <span className={styles.scrollText}>Scroll to explore</span>
            </div>
        </section>
    );
}
