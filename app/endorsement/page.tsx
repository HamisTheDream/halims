import type { Metadata } from "next";
import EndorsementPageClient from "./EndorsementPageClient";

export const metadata: Metadata = {
    title: "Create Your Endorsement Flyer — Rt. Hon. Abdullahi Ibrahim Ali (Halims)",
    description: "Upload your photo, pick a design, and generate a personalised campaign endorsement flyer for Rt. Hon. Abdullahi Ibrahim Ali (Halims).",
};


export default function EndorsementPage() {
    return <EndorsementPageClient />;
}
