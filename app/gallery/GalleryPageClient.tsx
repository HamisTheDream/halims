"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./gallery.module.css";
import { supabase } from "../lib/supabase";

type Photo = {
    id: string;
    title: string;
    category: string;
    image_url: string;
};

const albums = ["All", "Events", "Rallies", "Visits", "Outreach"];

export default function GalleryPageClient() {
    const revealRef = useRevealOnScroll();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState("All");
    const [lightbox, setLightbox] = useState<Photo | null>(null);

    useEffect(() => {
        const fetchGallery = async () => {
            const { data, error } = await supabase
                .from("gallery")
                .select("*")
                .order("created_at", { ascending: false });

            if (!error && data) {
                setPhotos(data);
            }
            setLoading(false);
        };
        fetchGallery();
    }, []);

    const filtered = active === "All" ? photos : photos.filter((p) => p.category === active);

    return (
        <div ref={revealRef}>
            <Navbar />

            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <p className={styles.heroEyebrow}>Campaign Gallery</p>
                    <h1 className={styles.heroTitle}>On the <em>Ground,</em><br />With the People</h1>
                    <p className={styles.heroDesc}>Moments from our journey across the three LGAs of Ankpa Federal Constituency.</p>
                </div>
            </section>

            <section className={styles.gallerySection}>
                <div className="container">
                    <div className={`${styles.filters} reveal`}>
                        {albums.map((a) => (
                            <button
                                key={a}
                                className={`${styles.filterBtn} ${active === a ? styles.filterActive : ""}`}
                                onClick={() => setActive(a)}
                            >
                                {a}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "100px", color: "var(--color-text-body)" }}>
                            Loading gallery via Supabase Storage...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "100px", color: "var(--color-text-body)" }}>
                            No {active !== "All" ? active : ""} photos uploaded yet. Check back soon.
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {filtered.map((p, i) => {
                                // Make every 4th item large for the masonry effect
                                const isLarge = i % 4 === 0;
                                return (
                                    <div
                                        key={p.id}
                                        className={`${styles.item} ${isLarge ? styles.itemLarge : ""} reveal`}
                                        onClick={() => setLightbox(p)}
                                    >
                                        <div className={styles.placeholder} style={{ padding: 0, overflow: "hidden" }}>
                                            <Image
                                                src={p.image_url}
                                                alt={p.title}
                                                fill
                                                style={{ objectFit: "cover" }}
                                                sizes={isLarge ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 50vw, 33vw"}
                                            />
                                        </div>
                                        <div className={styles.overlay}>
                                            <div className={styles.overlayContent}>
                                                <div className={styles.overlayIcon}>+</div>
                                                <p className={styles.overlayLabel}>{p.title}</p>
                                                <span className={styles.overlayAlbum}>{p.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Lightbox */}
            {lightbox !== null && (
                <div className={styles.lightbox} onClick={() => setLightbox(null)}>
                    <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>✕</button>
                    <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.lightboxImg} style={{ padding: 0, overflow: "hidden", background: "transparent" }}>
                            <Image
                                src={lightbox.image_url}
                                alt={lightbox.title}
                                fill
                                style={{ objectFit: "contain" }}
                            />
                        </div>
                        <p className={styles.lightboxCaption}>{lightbox.title}</p>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
