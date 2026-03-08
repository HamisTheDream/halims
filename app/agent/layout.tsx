import type { Metadata } from "next";

export const metadata: Metadata = { title: "Agent Portal — Halims Campaign" };

export default function AgentLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
