import type { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";
export const metadata: Metadata = { title: "Contact — Rt. Hon. Abdullahi Ibrahim Ali (Halims) Campaign", description: "Get in touch with Rt. Hon. Abdullahi Ibrahim Ali's campaign team. Phone, email, social media, and campaign HQ address." };
export default function ContactPage() { return <ContactPageClient />; }
