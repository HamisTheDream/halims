"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        if (token) {
            router.replace("/admin");
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Invalid credentials");
                setLoading(false);
                return;
            }
            // Store session
            localStorage.setItem("admin_token", data.token);
            localStorage.setItem("admin_user", JSON.stringify(data.admin));
            router.push("/admin");
        } catch {
            setError("Network error. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.loginCard}>
                <div className={styles.loginHeader}>
                    <div className={styles.logoMark}>🏛️</div>
                    <h1 className={styles.loginTitle}>Campaign HQ</h1>
                    <p className={styles.loginSubtitle}>Admin Login — Halims Campaign</p>
                </div>
                <form onSubmit={handleLogin} className={styles.loginForm}>
                    <div className={styles.field}>
                        <label className={styles.label}>Email Address</label>
                        <input type="email" required className={styles.input} placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Password</label>
                        <input type="password" required className={styles.input} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    {error && <p className={styles.error}>⚠️ {error}</p>}
                    <button type="submit" className={styles.loginBtn} disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
                <p className={styles.footer}>Admin access is restricted. Contact the campaign manager if you need an account.</p>
            </div>
        </div>
    );
}
