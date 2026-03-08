import type { Metadata } from "next";
import EventsPageClient from "./EventsPageClient";
export const metadata: Metadata = { title: "Events — Rt. Hon. Abdullahi Ibrahim Ali (Halims) Campaign", description: "Upcoming rallies, town halls, and community events across Ankpa Federal Constituency." };
export default function EventsPage() { return <EventsPageClient />; }
