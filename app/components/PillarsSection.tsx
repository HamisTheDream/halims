import styles from "./PillarsSection.module.css";

const pillars = [
    { num: "01", icon: "🏭", title: "Steel & Industrialization", desc: "As former Chairman of the House Committee on Steel, championing the full operationalization of the Ajaokuta Steel Company and revitalizing Nigeria's solid minerals sector to create thousands of industrial jobs across Kogi East." },
    { num: "02", icon: "📚", title: "Education & Human Capital", desc: "Subsidizing JAMB, WAEC, and NECO fees for thousands of indigent students. Establishing ICT hubs, vocational centres, and partnering with NDE for skills acquisition — because no child in Kogi East should be left behind." },
    { num: "03", icon: "🏛️", title: "Federal Presence & Infrastructure", desc: "Leveraging his position as a principal officer to attract federal road construction, bridges, rural electrification, clean water, and secure permanent employment for constituents in major federal parastatals." },
    { num: "04", icon: "🚀", title: "Youth & Women Empowerment", desc: "Creating jobs through partnerships with the National Productivity Centre, providing startup capital, digital transformation bootcamps, and entrepreneurship programmes that give Kogi East's young people the tools to build their futures." },
];

export default function PillarsSection() {
    return (
        <section id="vision" className={styles.section} aria-labelledby="vision-heading">
            <div className="container">
                <header className={`${styles.header} reveal`}>
                    <p className="section-label" style={{ justifyContent: "center" }} aria-hidden="true">Campaign Vision</p>
                    <h2 className={styles.title} id="vision-heading">Four Pillars of a<br /><em>Stronger Kogi East</em></h2>
                    <p className={styles.subtitle}>A clear, people-centered agenda for the Kogi East Senatorial District — built on industrialization, education, federal presence, and empowerment.</p>
                </header>
                <div className={styles.grid}>
                    {pillars.map((p, i) => (
                        <article key={i} className={`${styles.card} reveal reveal-delay-${i + 1}`}>
                            <span className={styles.num} aria-hidden="true">{p.num}</span>
                            <span className={styles.icon} role="img" aria-label={p.title}>{p.icon}</span>
                            <h3 className={styles.cardTitle}>{p.title}</h3>
                            <p className={styles.cardDesc}>{p.desc}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
