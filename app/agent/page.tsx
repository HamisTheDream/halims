"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AgentLoginPage() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("agent_data");
        if (stored) {
            const data = JSON.parse(stored);
            if (data.role === "ward_agent") {
                router.replace("/agent/ward");
            } else {
                router.replace("/agent/pu");
            }
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone || !pin) { setError("Phone and PIN are required"); return; }
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/agent/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: phone.trim(), pin }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Login failed");
                setLoading(false);
                return;
            }

            // Store agent session
            localStorage.setItem("agent_token", data.token);
            localStorage.setItem("agent_data", JSON.stringify(data.agent));

            // Redirect based on role
            if (data.agent.role === "ward_agent") {
                router.push("/agent/ward");
            } else {
                router.push("/agent/pu");
            }
        } catch {
            setError("Network error. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #0A3020 0%, #0e3d22 50%, #145235 100%)",
            fontFamily: "var(--font-body), system-ui, sans-serif",
        }}>
            <div style={{
                width: "100%", maxWidth: 400, padding: 36, borderRadius: 20,
                background: "rgba(10,48,32,0.85)", border: "1px solid rgba(201,162,39,0.2)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
                        background: "linear-gradient(135deg, #C9A227, #E8C560)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 24, fontWeight: 900, color: "#0A3020",
                    }}>
                        G1
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Agent Portal</h1>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Login with your phone number and PIN</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="08012345678"
                            style={{
                                width: "100%", padding: "14px 16px", borderRadius: 10,
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 15,
                                outline: "none",
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>PIN</label>
                        <input
                            type="password"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            placeholder="••••"
                            maxLength={8}
                            style={{
                                width: "100%", padding: "14px 16px", borderRadius: 10,
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 15, letterSpacing: 4,
                                outline: "none",
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(229,62,62,0.1)", border: "1px solid rgba(229,62,62,0.2)", color: "#e53e3e", fontSize: 12, marginBottom: 16 }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
                            background: "linear-gradient(135deg, #C9A227, #E8C560)",
                            color: "#0A3020", fontSize: 14, fontWeight: 800, letterSpacing: 1,
                            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                        }}
                    >
                        {loading ? "Signing in..." : "Sign In →"}
                    </button>
                </form>

                <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 20 }}>
                    Contact campaign admin if you need access
                </p>
            </div>
        </div>
    );
}
