import type { Metadata } from "next";
import NewsPostClient from "./NewsPostClient";

export const metadata: Metadata = {
    title: "News Article — Rt. Hon. Abdullahi Ibrahim Ali (Halims) Campaign",
    description: "Read the latest campaign news and updates from Rt. Hon. Abdullahi Ibrahim Ali (Halims).",
};

export default function NewsPostPage() {
    return <NewsPostClient />;
}
