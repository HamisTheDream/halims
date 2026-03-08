"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./admin.module.css";

interface AdminUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
}

const navItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/supporters", label: "Supporters", icon: "👥" },
    { href: "/admin/coverage", label: "PU Coverage", icon: "🗺️" },
    { href: "/admin/map", label: "Live Map", icon: "📍" },
    { href: "/admin/agents", label: "Ward Agents", icon: "🕵️" },
    { href: "/admin/situation-room", label: "Situation Room", icon: "🗳️" },
    { href: "/admin/election-day", label: "Election Day", icon: "🏁" },
    { href: "/admin/broadcast", label: "Broadcast", icon: "📣" },
    { href: "/admin/blog", label: "Blog / CMS", icon: "📝" },
    { href: "/admin/gallery", label: "Gallery", icon: "🖼️" },
    { href: "/admin/events", label: "Events", icon: "📅" },
    { href: "/admin/about", label: "About / Manifesto", icon: "📄" },
    { href: "/admin/flyers", label: "Flyer Stats", icon: "📸" },
    { href: "/admin/inbox", label: "Inbox", icon: "📬" },
    { href: "/admin/activity", label: "Activity Log", icon: "🔍" },
    { href: "/admin/settings", label: "Settings", icon: "⚙️" },
    { href: "/admin/profile", label: "My Profile", icon: "👤" },
];

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [admin, setAdmin] = useState<AdminUser | null>(null);
    const [checking, setChecking] = useState(true);

    // Skip auth for login page
    const isLoginPage = pathname === "/admin/login";

    useEffect(() => {
        if (isLoginPage) { setChecking(false); return; }

        const saved = localStorage.getItem("admin-theme");
        if (saved === "dark") setDarkMode(true);

        // Verify session
        const token = localStorage.getItem("admin_token");
        if (!token) { router.replace("/admin/login"); return; }

        fetch("/api/admin/me", { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((data) => {
                if (data.admin) {
                    setAdmin(data.admin);
                    setChecking(false);
                } else {
                    localStorage.removeItem("admin_token");
                    localStorage.removeItem("admin_user");
                    router.replace("/admin/login");
                }
            })
            .catch(() => {
                router.replace("/admin/login");
            });
    }, [isLoginPage, router]);

    const toggleTheme = () => {
        setDarkMode((prev) => {
            const next = !prev;
            localStorage.setItem("admin-theme", next ? "dark" : "light");
            return next;
        });
    };

    const handleLogout = () => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        router.replace("/admin/login");
    };

    // Login page renders without shell
    if (isLoginPage) return <>{children}</>;

    // Loading state while checking auth
    if (checking) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0e3d22" }}>
                <p style={{ color: "#C9A227", fontSize: 14, letterSpacing: 3, textTransform: "uppercase" }}>Loading...</p>
            </div>
        );
    }

    return (
        <div className={`${styles.adminShell} ${darkMode ? styles.dark : styles.light}`}>
            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}>
                <div className={styles.sidebarHeader}>
                    <Link href="/" className={styles.sidebarLogo}>
                        {!collapsed && <span className={styles.logoText}>Halims HQ</span>}
                        <span className={styles.logoBadge}>Admin</span>
                    </Link>
                    <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
                        {collapsed ? "→" : "←"}
                    </button>
                </div>
                <nav className={styles.sidebarNav}>
                    {navItems.map((item) => {
                        const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                        return (
                            <Link key={item.href} href={item.href} className={`${styles.navItem} ${active ? styles.navActive : ""}`} title={item.label}>
                                <span className={styles.navIcon}>{item.icon}</span>
                                {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>
                <div className={styles.sidebarFooter}>
                    <button onClick={handleLogout} className={styles.backToSite} style={{ border: "none", cursor: "pointer", background: "transparent", width: "100%", textAlign: "left" }}>
                        <span>🚪</span>
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                    <Link href="/" className={styles.backToSite}>
                        <span>🌐</span>
                        {!collapsed && <span>View Public Site</span>}
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <header className={styles.topBar}>
                    <div className={styles.topBarLeft}>
                        <h2 className={styles.topBarTitle}>Campaign HQ</h2>
                    </div>
                    <div className={styles.topBarRight}>
                        <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
                            {darkMode ? "☀️" : "🌙"}
                        </button>
                        <div className={styles.notificationBell}>🔔<span className={styles.notifDot} /></div>
                        <div className={styles.adminAvatar} title={admin ? `${admin.first_name} ${admin.last_name}` : ""}>
                            {admin ? `${admin.first_name[0]}${admin.last_name[0]}` : "AD"}
                        </div>
                    </div>
                </header>
                <div className={styles.pageContent}>
                    {children}
                </div>
            </main>
        </div>
    );
}
