import styles from "./PillarsSection.module.css";

const pillars = [
    { num: "01", icon: "🏗️", title: "Enterprise & Jobs", desc: "Building local economies across all three LGAs — supporting small businesses, attracting investment, and creating sustainable employment through enterprise development and skills training." },
    { num: "02", icon: "📚", title: "Education", desc: "Rehabilitating schools, providing scholarships, and establishing vocational training centres and ICT hubs to empower the next generation with in-demand skills." },
    { num: "03", icon: "🛣️", title: "Infrastructure", desc: "Championing federal road construction, bridges, rural electrification, and clean water access that connects communities — because development begins with connectivity." },
    { num: "04", icon: "🚀", title: "Youth Empowerment", desc: "Creating jobs, supporting entrepreneurship, digital transformation, and establishing youth empowerment programmes that give the constituency's young people the tools to build their futures." },
];

export default function PillarsSection() {
    return (
        <section id="vision" className={styles.section} aria-labelledby="vision-heading">
            <div className="container">
                <header className={`${styles.header} reveal`}>
                    <p className="section-label" style={{ justifyContent: "center" }} aria-hidden="true">Campaign Vision</p>
                    <h2 className={styles.title} id="vision-heading">Four Pillars of a<br /><em>Stronger Constituency</em></h2>
                    <p className={styles.subtitle}>A clear, people-centered agenda for the Ankpa Federal Constituency — built on healthcare, education, infrastructure, and opportunity.</p>
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
