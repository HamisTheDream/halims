import type { Metadata } from "next";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata: Metadata = {
    title: "Admin Dashboard — Halims Campaign HQ",
    description: "Campaign management dashboard for Rt. Hon. Abdullahi Ibrahim Ali (Halims).",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
