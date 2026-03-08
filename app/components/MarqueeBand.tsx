import styles from "./MarqueeBand.module.css";

const items = [
    "Vote Halims 2027", "Healthcare for All", "Ankpa Federal Constituency",
    "Better Education", "Infrastructure Development", "Youth Empowerment",
    "Kogi State Representation", "Rt. Hon. Abdullahi Ibrahim Ali (Halims)",
];

export default function MarqueeBand() {
    return (
        <div className={styles.band} aria-hidden="true">
            <div className={styles.track}>
                {[...items, ...items].map((item, i) => (
                    <span className={styles.item} key={i}>{item} <span className={styles.sep} /></span>
                ))}
            </div>
        </div>
    );
}
