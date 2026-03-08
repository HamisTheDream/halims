"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./blog.module.css";
import { supabase } from "../lib/supabase";

const categories = ["All", "Campaign News", "Community", "Policy", "Events", "Press Release"];

type BlogPost = {
    id: string;
    title: string;
    slug?: string;
    category: string;
    excerpt: string;
    image_url: string;
    published_at: string;
};

export default function BlogPageClient() {
    const revealRef = useRevealOnScroll();
    const [active, setActive] = useState("All");
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    // Newsletter State
    const [email, setEmail] = useState("");
    const [subStatus, setSubStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [subMessage, setSubMessage] = useState("");

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("posts")
            .select("id, title, slug, category, excerpt, image_url, published_at")
            .not("published_at", "is", null)
            .order("published_at", { ascending: false });

        if (error) {
            console.error("Blog fetch error:", error);
        }
        if (data) {
            console.log("Fetched posts:", data.length);
            setPosts(data);
        }
        setLoading(false);
    };

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setSubStatus("loading");
        const { error } = await supabase.from("subscribers").insert([{ email }]);

        if (error) {
            if (error.code === "23505") { // unique violation
                setSubMessage("This email is already subscribed!");
            } else {
                setSubMessage("Failed to subscribe. Please try again.");
            }
            setSubStatus("error");
        } else {
            setSubMessage("Successfully subscribed to campaign updates!");
            setSubStatus("success");
            setEmail("");
        }

        setTimeout(() => setSubStatus("idle"), 5000);
    };

    const filtered = active === "All" ? posts : posts.filter((p) => p.category === active);

    return (
        <div ref={revealRef}>
            <Navbar />

            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <p className={styles.heroEyebrow}>Campaign Updates</p>
                    <h1 className={styles.heroTitle}>News &amp;<br /><em>Updates</em></h1>
                    <p className={styles.heroDesc}>The latest from Rt. Hon. Abdullahi Ibrahim Ali&apos;s campaign across Ankpa Federal Constituency.</p>
                </div>
            </section>

            <section className={styles.blogSection}>
                <div className="container">
                    {/* Category Filter */}
                    <div className={`${styles.filters} reveal`}>
                        {categories.map((c) => (
                            <button
                                key={c}
                                className={`${styles.filterBtn} ${active === c ? styles.filterActive : ""}`}
                                onClick={() => setActive(c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    {/* Posts Grid */}
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "100px", color: "var(--color-text-body)" }}>
                            Loading latest campaign news...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "100px", color: "var(--color-text-body)" }}>
                            No published news found for {active === "All" ? "any category" : active}. Check back later.
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {filtered.map((p, i) => {
                                const isFeatured = i === 0;
                                return (
                                    <article key={p.id} className={`${styles.card} ${isFeatured ? styles.featured : ""} reveal reveal-delay-${Math.min(i + 1, 4)}`}>
                                        <div className={`${styles.cardImg} ${isFeatured ? styles.featuredImg : ""}`} style={{ overflow: "hidden" }}>
                                            {p.image_url ? (
                                                <Image
                                                    src={p.image_url}
                                                    alt={p.title}
                                                    fill
                                                    style={{ objectFit: "cover" }}
                                                    sizes={isFeatured ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 50vw, 33vw"}
                                                />
                                            ) : (
                                                <div className={styles.imgPlaceholder}>📰</div>
                                            )}
                                            <div className={styles.imgOverlay} />
                                        </div>
                                        <div className={styles.cardBody}>
                                            <span className={styles.tag}>{p.category}</span>
                                            <h2 className={styles.cardTitle}>{p.title}</h2>
                                            <p className={styles.excerpt}>{p.excerpt}</p>
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

                    {/* Newsletter CTA */}
                    <div className={`${styles.newsletter} reveal`} style={{ marginTop: "60px" }}>
                        <div className={styles.nlContent}>
                            <h3 className={styles.nlTitle}>Stay Informed</h3>
                            <p className={styles.nlDesc}>Subscribe for campaign updates, event notifications, and policy announcements.</p>
                        </div>
                        <form className={styles.nlForm} onSubmit={handleSubscribe}>
                            <input
                                type="email"
                                className={styles.nlInput}
                                placeholder="Enter your email address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={subStatus === "loading"}
                            >
                                {subStatus === "loading" ? "Subscribing..." : "Subscribe"}
                            </button>
                        </form>
                    </div>

                    {subStatus === "success" && (
                        <p style={{ textAlign: "center", color: "#1D7A50", fontWeight: "bold", marginTop: "16px" }}>{subMessage}</p>
                    )}
                    {subStatus === "error" && (
                        <p style={{ textAlign: "center", color: "#B22222", fontWeight: "bold", marginTop: "16px" }}>{subMessage}</p>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
