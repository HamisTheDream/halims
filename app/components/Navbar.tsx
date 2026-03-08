"use client";
import { useState } from "react";
import Image from "next/image";
import styles from "./Navbar.module.css";

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    const links = [
        { href: "/about", label: "About" },
        { href: "/blog", label: "News" },
        { href: "/gallery", label: "Gallery" },
        { href: "/events", label: "Events" },
        { href: "/endorsement", label: "Endorsements" },
        { href: "/contact", label: "Contact" },
    ];

    return (
        <>
            <nav className={styles.nav} role="navigation" aria-label="Main navigation">
                <div className={styles.inner}>
                    <a href="/" className={styles.logo}>
                        <Image src="/images/apc-logo.png" alt="APC Logo" width={40} height={40} className={styles.logoImg} priority />
                        <div className={styles.logoTextWrap}>
                            <span className={styles.logoName}>Rt. Hon. Abdullahi Ibrahim Ali</span>
                            <span className={styles.logoSub}>Ankpa Federal Constituency</span>
                            <span className={styles.logoBadge}>APC · House of Reps · 2027</span>
                        </div>
                    </a>
                    <ul className={`${styles.links} nav-links`}>
                        {links.map((l) => (
                            <li key={l.href}><a href={l.href}>{l.label}</a></li>
                        ))}
                        <li><a href="/register" className={styles.cta}>Register Support</a></li>
                    </ul>
                    <button className={`${styles.hamburger} nav-hamburger`} aria-label="Open menu" onClick={() => setMobileOpen(true)}>
                        <span /><span /><span />
                    </button>
                </div>
            </nav>
            {/* Mobile Nav */}
            <div className={`${styles.mobileNav} ${mobileOpen ? styles.mobileOpen : ""}`} role="dialog" aria-modal="true">
                <button className={styles.mobileClose} onClick={() => setMobileOpen(false)} aria-label="Close menu">✕</button>
                <div className={styles.mobileLogo}>
                    <Image src="/images/apc-logo.png" alt="APC Logo" width={48} height={48} />
                    <span>All Progressives Congress</span>
                </div>
                {links.map((l) => (
                    <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>{l.label}</a>
                ))}
                <a href="/register" onClick={() => setMobileOpen(false)}>Register Support</a>
            </div>
        </>
    );
}
