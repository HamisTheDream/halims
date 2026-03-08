import styles from "./RegisterSection.module.css";

export default function RegisterSection() {
    return (
        <section id="register" className={styles.section} aria-labelledby="register-heading">
            <div className="container">
                <div className={`${styles.inner} reveal`}>
                    <p className={styles.label}>Join the Movement</p>
                    <h2 className={styles.title} id="register-heading">Your Support<br /><em>Changes Everything</em></h2>
                    <p className={styles.subtitle}>Register as an official supporter — help us map every ward and polling unit. Your information helps the campaign reach every corner of Kogi East Senatorial District.</p>
                    <div className={styles.actions}>
                        <a href="#" className="btn-dark">✍️ Register as Supporter</a>
                        <a href="#endorse" className="btn-ghost-dark">📸 Get Endorsement Flyer</a>
                    </div>
                    <div className={styles.stats}>
                        {[
                            { num: "9", label: "LGAs" },
                            { num: "97", label: "Wards" },
                            { num: "1,714", label: "Polling Units" },
                            { num: "0", label: "Supporters" },
                        ].map((s, i) => (
                            <div key={i}><div className={styles.statNum}>{s.num}</div><div className={styles.statLabel}>{s.label}</div></div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
