import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./BlogSection.module.css";
import { supabase } from "../lib/supabase";

type BlogPost = {
    id: string;
    title: string;
    slug?: string;
    category: string;
    excerpt: string;
    image_url: string;
    published_at: string;
};

export default function BlogSection() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            const { data, error } = await supabase
                .from("posts")
                .select("id, title, slug, category, excerpt, image_url, published_at")
                .not("published_at", "is", null)
                .order("published_at", { ascending: false })
                .limit(3);

            if (error) {
                console.error("Homepage blog fetch error:", error);
            }
            if (data) {
                setPosts(data);
            }
            setLoading(false);
        };
        fetchPosts();
    }, []);

    return (
        <section id="blog" className={styles.section} aria-labelledby="blog-heading">
            <div className="container">
                <header className={styles.header}>
                    <div>
                        <p className="section-label" aria-hidden="true">Campaign Updates</p>
                        <h2 className={`${styles.title} reveal`} id="blog-heading">Latest <em>News &amp; Updates</em></h2>
                    </div>
                    <a href="/news" className="btn-outline reveal" style={{ color: "var(--green-deep)", borderColor: "var(--green-deep)" }}>View All News →</a>
                </header>

                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-body)" }}>
                        Loading latest campaign news...
                    </div>
                ) : posts.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-body)" }}>
                        Stay tuned for upcoming news and announcements!
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {posts.map((p, i) => {
                            const isFeatured = i === 0;
                            return (
                                <article key={p.id} className={`${styles.card} ${isFeatured ? styles.featured : ""} reveal reveal-delay-${i + 1}`}>
                                    <div className={`${styles.cardImg} ${isFeatured ? styles.featuredImg : ""}`} style={{ overflow: "hidden" }}>
                                        {p.image_url ? (
                                            <Image
                                                src={p.image_url}
                                                alt={p.title}
                                                fill
                                                style={{ objectFit: "cover" }}
                                            />
                                        ) : (
                                            <div className={styles.imgPlaceholder}>📰</div>
                                        )}
                                        <div className={styles.imgOverlay} />
                                    </div>
                                    <div className={styles.cardBody}>
                                        <span className={styles.tag}>{p.category}</span>
                                        <h3 className={styles.cardTitle}>{p.title}</h3>
                                        {isFeatured && <p className={styles.excerpt}>{p.excerpt}</p>}
                                        <div className={styles.cardMeta}>
                                            <span>{new Date(p.published_at).toLocaleDateString()}</span>
                                            <a href={`/news/${p.slug || p.id}`} className={styles.readMore}>Read {isFeatured ? "More" : ""} →</a>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
