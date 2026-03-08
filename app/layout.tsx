import type { Metadata } from "next";
import { Playfair_Display, Barlow_Condensed, Barlow } from "next/font/google";
import { supabase } from "./lib/supabase";
import "./globals.css";

export const revalidate = 60; // Revalidate dynamic metadata every 60 seconds

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});

// Default values used as fallbacks when site_settings is empty
const DEFAULTS = {
  title: "Rt. Hon. Abdullahi Ibrahim Ali (Halims) — House of Representatives 2027",
  description: "Official campaign website for Rt. Hon. Abdullahi Ibrahim Ali (Halims) — contesting for the Ankpa Federal Constituency seat (Ankpa/Omala/Olamaboro) in the 2027 Nigerian General Elections.",
  ogTitle: "Vote Rt. Hon. Abdullahi Ibrahim Ali (Halims) — Ankpa Federal Constituency 2027",
  ogDescription: "A distinguished entrepreneur, philanthropist, and visionary leader bringing enterprise, integrity, and passion for the Igala people to the National Assembly.",
  ogImage: "/images/halims-2.png",
};

export async function generateMetadata(): Promise<Metadata> {
  // Fetch SEO settings from Supabase
  let seo: Record<string, string> = {};
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .like("key", "seo_%");
    if (data) {
      for (const item of data) seo[item.key] = item.value || "";
    }
  } catch {
    // Fallback to defaults if Supabase is unreachable
  }

  const title = seo.seo_title || DEFAULTS.title;
  const description = seo.seo_description || DEFAULTS.description;
  const ogTitle = seo.seo_og_title || DEFAULTS.ogTitle;
  const ogDescription = seo.seo_og_description || DEFAULTS.ogDescription;
  const ogImage = seo.seo_og_image || DEFAULTS.ogImage;
  const favicon = seo.seo_favicon || undefined;

  return {
    title,
    description,
    manifest: "/manifest.json",
    icons: favicon ? { icon: favicon, shortcut: favicon, apple: favicon } : undefined,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "website",
      url: "https://localhost:3000",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Rt. Hon. Abdullahi Ibrahim Ali (Halims) for House of Reps 2027",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${barlowCondensed.variable} ${barlow.variable}`}>
      <body>{children}</body>
    </html>
  );
}
