"use client";
import { useState, useEffect } from "react";
import styles from "./CountdownTimer.module.css";

const ELECTION_DATE = new Date("2027-01-16T08:00:00+01:00"); // WAT

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function calcTimeLeft(): TimeLeft {
    const diff = ELECTION_DATE.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
    };
}

export default function CountdownTimer() {
    const [time, setTime] = useState<TimeLeft>(calcTimeLeft());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const id = setInterval(() => setTime(calcTimeLeft()), 1000);
        return () => clearInterval(id);
    }, []);

    if (!mounted) return null;

    const blocks = [
        { value: time.days, label: "Days" },
        { value: time.hours, label: "Hours" },
        { value: time.minutes, label: "Minutes" },
        { value: time.seconds, label: "Seconds" },
    ];

    return (
        <div className={styles.wrapper}>
            <p className={styles.eyebrow}>🗳️ Election Day Countdown</p>
            <div className={styles.grid}>
                {blocks.map((b) => (
                    <div key={b.label} className={styles.block}>
                        <span className={styles.num}>
                            {String(b.value).padStart(2, "0")}
                        </span>
                        <span className={styles.label}>{b.label}</span>
                    </div>
                ))}
            </div>
            <p className={styles.date}>January 16, 2027 · National Assembly Elections</p>
        </div>
    );
}
