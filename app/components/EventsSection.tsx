import { useEffect, useState } from "react";
import styles from "./EventsSection.module.css";
import { supabase } from "../lib/supabase";

type CampaignEvent = {
    id: string;
    title: string;
    date: string;
    location: string;
    description: string;
};

export default function EventsSection() {
    const [events, setEvents] = useState<CampaignEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLatestEvents = async () => {
            const { data, error } = await supabase
                .from("events")
                .select("*")
                .gte("date", new Date().toISOString()) // Only upcoming
                .order("date", { ascending: true })
                .limit(4);

            if (!error && data) {
                setEvents(data);
            }
            setLoading(false);
        };
        fetchLatestEvents();
    }, []);

    const formatEventDate = (dateString: string) => {
        const d = new Date(dateString);
        return {
            day: d.toLocaleString('en-US', { day: '2-digit' }),
            month: d.toLocaleString('en-US', { month: 'short' }),
        };
    };

    return (
        <section id="events" className={styles.section} aria-labelledby="events-heading">
            <div className="container">
                <header className={styles.header}>
                    <div>
                        <p className="section-label" aria-hidden="true">Upcoming Events</p>
                        <h2 className={`${styles.title} reveal`} id="events-heading">Meet Rt. Hon. Abdullahi Ibrahim Ali<br /><em>In Your Community</em></h2>
                    </div>
                    <a href="/events" className="btn-outline reveal" style={{ color: "var(--green-deep)", borderColor: "var(--green-deep)" }}>Full Schedule →</a>
                </header>

                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-body)" }}>
                        Loading events...
                    </div>
                ) : events.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-body)" }}>
                        No upcoming events scheduled right now. Check back soon!
                    </div>
                ) : (
                    <ul className={styles.list} role="list">
                        {events.map((e, i) => {
                            const dateInfo = formatEventDate(e.date);
                            return (
                                <li key={e.id} className={`${styles.item} reveal reveal-delay-${Math.min(i + 1, 4)}`}>
                                    <div className={styles.dateBlock}>
                                        <div className={styles.day}>{dateInfo.day}</div>
                                        <div className={styles.month}>{dateInfo.month}</div>
                                    </div>
                                    <div className={styles.info}>
                                        <p className={styles.type}>Campaign Event</p>
                                        <h3 className={styles.name}>{e.title}</h3>
                                        <p className={styles.location}>📍 {e.location}</p>
                                    </div>
                                    <a href="/register" className={styles.rsvp}>RSVP →</a>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </section>
    );
}
