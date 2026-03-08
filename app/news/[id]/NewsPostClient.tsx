"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import styles from "./newspost.module.css";

type BlogPost = {
    id: string;
    title: string;
    slug?: string;
    category: string;
    excerpt: string;
    content: string;
    image_url: string;
    published_at: string;
    created_at: string;
};

export default function NewsPostClient() {
    const { id } = useParams();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [currentUrl, setCurrentUrl] = useState("");

    useEffect(() => {
        setCurrentUrl(window.location.href);
    }, []);

    useEffect(() => {
        if (!id) return;
        async function fetchPost() {
            // Try by slug first, then by UUID
            const param = id as string;
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);

            let query;
            if (isUUID) {
                query = supabase.from("posts").select("*").eq("id", param).single();
            } else {
                query = supabase.from("posts").select("*").eq("slug", param).single();
            }

            const { data, error } = await query;

            if (error || !data) {
                setNotFound(true);
            } else {
                setPost(data);
            }
            setLoading(false);
        }
        fetchPost();
    }, [id]);

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className={styles.loadingWrap}>
                    <div className={styles.spinner} />
                    <p>Loading article...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (notFound || !post) {
        return (
            <div>
                <Navbar />
                <div className={styles.notFound}>
                    <span className={styles.notFoundIcon}>📰</span>
                    <h1>Article Not Found</h1>
                    <p>The article you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                    <a href="/blog" className={styles.backBtn}>← Back to News</a>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div>
            <Navbar />

            {/* Hero / Featured Image */}
            {post.image_url && (
                <div className={styles.heroImage}>
                    <Image
                        src={post.image_url}
                        alt={post.title}
                        fill
                        style={{ objectFit: "cover" }}
                        priority
                    />
                    <div className={styles.heroOverlay} />
                </div>
            )}

            {/* Article */}
            <article className={styles.article}>
                <div className={styles.articleContainer}>
                    <div className={styles.meta}>
                        <span className={styles.category}>{post.category}</span>
                        <span className={styles.date}>
                            {new Date(post.published_at || post.created_at).toLocaleDateString("en-NG", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </span>
                    </div>

                    <h1 className={styles.title}>{post.title}</h1>

                    {post.excerpt && (
                        <p className={styles.excerpt}>{post.excerpt}</p>
                    )}

                    <div
                        className={styles.content}
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    <div className={styles.footer}>
                        <a href="/blog" className={styles.backLink}>← Back to All News</a>
                        <div className={styles.share}>
                            <span className={styles.shareLabel}>Share:</span>
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(post.title + ' - Read more: ' + currentUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.shareBtn}
                                style={{ background: "#25D366", color: "#fff", borderColor: "#25D366" }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                &nbsp;WhatsApp
                            </a>
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.shareBtn}
                                style={{ background: "#1877F2", color: "#fff", borderColor: "#1877F2" }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                &nbsp;Facebook
                            </a>
                        </div>
                    </div>
                </div>
            </article>

            <Footer />
        </div>
    );
}
