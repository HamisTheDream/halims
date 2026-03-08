import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./GallerySection.module.css";
import { supabase } from "../lib/supabase";

type Photo = {
    id: string;
    title: string;
    image_url: string;
};

export default function GallerySection() {
    const [items, setItems] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGallery = async () => {
            const { data, error } = await supabase
                .from("gallery")
                .select("id, title, image_url")
                .order("created_at", { ascending: false })
                .limit(6);

            if (!error && data) {
                setItems(data);
            }
            setLoading(false);
        };
        fetchGallery();
    }, []);

    return (
        <section id="gallery" className={styles.section} aria-labelledby="gallery-heading">
            <div className="container">
                <header className={styles.header}>
                    <div>
                        <p className="section-label" aria-hidden="true">Campaign Gallery</p>
                        <h2 className={`${styles.title} reveal`} id="gallery-heading">On the <em>Ground,</em><br />With the People</h2>
                    </div>
                    <a href="/gallery" className="btn-outline reveal">View Full Gallery →</a>
                </header>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-body)" }}>
                        Loading latest campaign photos...
                    </div>
                ) : items.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-body)" }}>
                        Stay tuned for upcoming photos from the campaign trail!
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {items.map((item, i) => (
                            <div key={item.id} className={`${styles.item} ${i === 0 ? styles.itemLarge : ""} reveal reveal-delay-${Math.min(i + 1, 4)}`}>
                                <div className={styles.placeholder} style={{ padding: 0, overflow: "hidden" }}>
                                    <Image
                                        src={item.image_url}
                                        alt={item.title}
                                        fill
                                        style={{ objectFit: "cover" }}
                                        sizes={i === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                                    />
                                </div>
                                <div className={styles.overlay}>
                                    <div className={styles.overlayIcon}>+</div>
                                    <p style={{ color: "#fff", fontWeight: "600", marginTop: "10px", textAlign: "center", fontSize: "14px" }}>
                                        {item.title}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
