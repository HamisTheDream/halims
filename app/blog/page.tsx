import type { Metadata } from "next";
import BlogPageClient from "./BlogPageClient";

export const metadata: Metadata = {
    title: "News & Updates — Rt. Hon. Abdullahi Ibrahim Ali (Halims) Campaign",
    description: "Stay updated with the latest campaign news, policy positions, and community updates from Rt. Hon. Abdullahi Ibrahim Ali (Halims).",
};

export default function BlogPage() {
    return <BlogPageClient />;
}
