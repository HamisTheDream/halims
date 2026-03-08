"use client";
import { useEffect, useState } from "react";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./events.module.css";
import { supabase } from "../lib/supabase";

type CampaignEvent = {
    id: string;
    title: string;
    date: string;
    location: string;
    description: string;
    image_url: string;
};

export default function EventsPageClient() {
    const revealRef = useRevealOnScroll();
    const [events, setEvents] = useState<CampaignEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            const { data, error } = await supabase
                .from("events")
                .select("*")
                .order("date", { ascending: true });

            if (!error && data) {
                setEvents(data);
            }
            setLoading(false);
        };
        fetchEvents();
    }, []);

    const formatEventDate = (dateString: string) => {
        const d = new Date(dateString);
        return {
            day: d.toLocaleString('en-US', { day: '2-digit' }),
            month: d.toLocaleString('en-US', { month: 'short' }),
            year: d.getFullYear().toString(),
            isUpcoming: d > new Date()
        };
    };

    return (
        <div ref={revealRef}>
            <Navbar />

            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <p className={styles.heroEyebrow}>Campaign Schedule</p>
                    <h1 className={styles.heroTitle}>Upcoming<br /><em>Events</em></h1>
                    <p className={styles.heroDesc}>Meet Rt. Hon. Abdullahi Ibrahim Ali in your community — rallies, town halls, and outreach events across all 3 LGAs.</p>
                </div>
            </section>

            <section className={styles.eventsSection}>
                <div className="container">
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "100px", color: "var(--color-text-body)" }}>
                            Loading events schedule...
                        </div>
                    ) : events.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "100px", color: "var(--color-text-body)" }}>
                            No upcoming events currently scheduled. Please check back later!
                        </div>
                    ) : (
                        <div className={styles.eventsList}>
                            {events.map((e) => {
                                const dateInfo = formatEventDate(e.date);
                                return (
                                    <div key={e.id} className={`${styles.eventCard} reveal`}>
                                        <div className={styles.eventDate}>
                                            <span className={styles.eventDay}>{dateInfo.day}</span>
                                            <span className={styles.eventMonth}>{dateInfo.month}</span>
                                            <span className={styles.eventYear}>{dateInfo.year}</span>
                                        </div>
                                        <div className={styles.eventInfo}>
                                            <span className={styles.eventType}>Campaign Event</span>
                                            <h2 className={styles.eventName}>{e.title}</h2>
                                            {e.description && <p className={styles.eventDesc}>{e.description}</p>}
                                            <p className={styles.eventLocation}>📍 {e.location}</p>
                                        </div>
                                        <div className={styles.eventActions}>
                                            {dateInfo.isUpcoming && <a href="/register" className={styles.rsvpBtn}>RSVP →</a>}
                                            <a href="#" className={styles.shareBtn}>Share</a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
