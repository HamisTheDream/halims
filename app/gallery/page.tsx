import type { Metadata } from "next";
import GalleryPageClient from "./GalleryPageClient";
export const metadata: Metadata = { title: "Gallery — Rt. Hon. Abdullahi Ibrahim Ali (Halims) Campaign", description: "Photos and videos from Rt. Hon. Abdullahi Ibrahim Ali's campaign across Ankpa Federal Constituency." };
export default function GalleryPage() { return <GalleryPageClient />; }
