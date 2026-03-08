import type { Metadata } from "next";
import RegisterPageClient from "./RegisterPageClient";

export const metadata: Metadata = {
    title: "Register Your Support — Rt. Hon. Abdullahi Ibrahim Ali (Halims)",
    description: "Register as an official supporter of Rt. Hon. Abdullahi Ibrahim Ali (Halims) for House of Representatives, Ankpa Federal Constituency 2027.",
};


export default function RegisterPage() {
    return <RegisterPageClient />;
}
