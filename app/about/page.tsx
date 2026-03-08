import type { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

export const metadata: Metadata = {
    title: "About Rt. Hon. Abdullahi Ibrahim Ali (Halims) — Campaign 2027",
    description: "Learn about Rt. Hon. Abdullahi Ibrahim Ali (Halims)'s vision, career, achievements, and commitment to Ankpa Federal Constituency.",
};


export default function AboutPage() {
    return <AboutPageClient />;
}
