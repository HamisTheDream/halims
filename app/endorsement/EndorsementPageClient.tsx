"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./endorsement.module.css";
import { supabase } from "../lib/supabase";

/* ── Template definitions ── */
interface Template {
    id: string;
    name: string;
    preview: string; // gradient
    bg: string;
    accent: string;
    secondary: string;
    textPrimary: string;
    textSecondary: string;
}

const templates: Template[] = [
    { id: "victory", name: "Victory Green", preview: "linear-gradient(135deg, #0A6B3F, #C9A227)", bg: "#FFFFFF", accent: "#0A6B3F", secondary: "#C9A227", textPrimary: "#0A3020", textSecondary: "#555555" },
    { id: "golden", name: "Golden Rally", preview: "linear-gradient(135deg, #C9A227, #F5E5A8)", bg: "#FFF9E6", accent: "#C9A227", secondary: "#0A6B3F", textPrimary: "#1A1A1A", textSecondary: "#666666" },
    { id: "bold", name: "Bold APC", preview: "linear-gradient(135deg, #B22222, #C9A227)", bg: "#0A3020", accent: "#C9A227", secondary: "#FFFFFF", textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.7)" },
    { id: "bright", name: "Bright Future", preview: "linear-gradient(135deg, #1D7A50, #E8C560)", bg: "#F0FFF5", accent: "#1D7A50", secondary: "#C9A227", textPrimary: "#0A3020", textSecondary: "#3A6B4A" },
    { id: "prestige", name: "Prestige", preview: "linear-gradient(135deg, #1A1A1A, #C9A227)", bg: "#FDFDFD", accent: "#0A3020", secondary: "#C9A227", textPrimary: "#1A1A1A", textSecondary: "#777777" },
    { id: "patriot", name: "Patriot", preview: "linear-gradient(135deg, #0A6B3F, #FFFFFF)", bg: "#0A6B3F", accent: "#FFFFFF", secondary: "#C9A227", textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.65)" },
];

const W = 1080, H = 1350;

/* ── Helper: rounded rect ── */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/* ── Helper: wrap text ── */
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, align: CanvasTextAlign = "center") {
    ctx.textAlign = align;
    const words = text.split(" ");
    let line = "";
    let curY = y;
    for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > maxW && line) {
            ctx.fillText(line.trim(), x, curY);
            line = word + " ";
            curY += lineH;
        } else { line = test; }
    }
    ctx.fillText(line.trim(), x, curY);
    return curY;
}

/* ── Draw photo in circle ── */
function drawCirclePhoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, cx: number, cy: number, r: number, borderColor: string, placeholder: string) {
    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, Math.PI * 2); ctx.stroke();
    // Clip
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    if (img) {
        const aspect = img.width / img.height;
        let dw = r * 2, dh = r * 2;
        if (aspect > 1) dw = dh * aspect; else dh = dw / aspect;
        ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    } else {
        ctx.fillStyle = borderColor + "18";
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        ctx.font = "bold 13px 'Barlow Condensed', sans-serif";
        ctx.fillStyle = borderColor;
        ctx.textAlign = "center";
        ctx.fillText(placeholder, cx, cy + 5);
    }
    ctx.restore();
}

/* ── Draw photo in rounded rect ── */
function drawRectPhoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, w: number, h: number, r: number, borderColor: string, placeholder: string) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    roundRect(ctx, x, y, w, h, r); ctx.stroke();
    ctx.save();
    roundRect(ctx, x + 3, y + 3, w - 6, h - 6, r); ctx.clip();
    if (img) {
        const aspect = img.width / img.height;
        let dw = w, dh = h;
        if (aspect > w / h) dw = dh * aspect; else dh = dw / aspect;
        ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    } else {
        ctx.fillStyle = borderColor + "12";
        ctx.fillRect(x, y, w, h);
        ctx.font = "bold 13px 'Barlow Condensed', sans-serif";
        ctx.fillStyle = borderColor;
        ctx.textAlign = "center";
        ctx.fillText(placeholder, x + w / 2, y + h / 2 + 5);
    }
    ctx.restore();
}

/* ── Draw APC logo ── */
function drawLogo(ctx: CanvasRenderingContext2D, logo: HTMLImageElement | null, x: number, y: number, maxH: number) {
    if (logo) {
        const aspect = logo.width / logo.height;
        const h = maxH, w = h * aspect;
        ctx.drawImage(logo, x - w / 2, y, w, h);
        return w;
    }
    return 0;
}

/* ══════════════════════════════════════════════════════════════
   MAIN RENDER FUNCTION
   ══════════════════════════════════════════════════════════════ */
function renderFlyer(
    canvas: HTMLCanvasElement,
    template: Template,
    supporterPhoto: HTMLImageElement | null,
    chiefPhoto: HTMLImageElement | null,
    adcLogo: HTMLImageElement | null,
    userName: string,
    userLocation: string,
    nigeriaBg: HTMLImageElement | null,
    nassBg: HTMLImageElement | null,
    igalaBg: HTMLImageElement | null,
) {
    const ctx = canvas.getContext("2d")!;
    canvas.width = W;
    canvas.height = H;

    const { bg, accent, secondary, textPrimary, textSecondary, id } = template;
    const isDark = bg === "#0A3020" || bg === "#0A6B3F";

    /* ── Background ── */
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* ── Creative photo backgrounds ── */
    const baseOpacity = isDark ? 0.08 : 0.06;

    // Helper to draw a background image covering the full canvas
    const drawBgImage = (img: HTMLImageElement | null, opacity: number) => {
        if (!img) return;
        ctx.save();
        ctx.globalAlpha = opacity;
        const imgAspect = img.width / img.height;
        const canvasAspect = W / H;
        let dw = W, dh = H;
        if (imgAspect > canvasAspect) {
            dh = H; dw = H * imgAspect;
        } else {
            dw = W; dh = W / imgAspect;
        }
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
        ctx.restore();
    };

    if (id === "victory" || id === "bright" || id === "prestige") {
        // Layout A: Nigerian flag as primary, NASS as subtle accent
        drawBgImage(nigeriaBg, baseOpacity * 1.2);
        drawBgImage(nassBg, baseOpacity * 0.4);
    } else if (id === "golden" || id === "patriot") {
        // Layout B: Igala flag as primary, Nigerian flag as subtle accent
        drawBgImage(igalaBg, baseOpacity * 1.4);
        drawBgImage(nigeriaBg, baseOpacity * 0.3);
    } else if (id === "bold") {
        // Layout C: NASS building as primary, Igala flag as subtle accent
        drawBgImage(nassBg, baseOpacity * 1.5);
        drawBgImage(igalaBg, baseOpacity * 0.35);
    }

    if (id === "victory" || id === "bright" || id === "prestige") {
        /* ══════════════════════════════════════════════════
           LAYOUT A: Bright, split — supporter left, chief right
           ══════════════════════════════════════════════════ */

        /* Top banner */
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, W, 90);
        ctx.font = "800 36px 'Barlow Condensed', sans-serif";
        ctx.fillStyle = isDark ? accent : "#FFFFFF";
        ctx.textAlign = "center";
        ctx.letterSpacing = "6px";
        ctx.fillText("ALL PROGRESSIVES CONGRESS", W / 2, 45);
        ctx.letterSpacing = "0px";
        ctx.font = "600 24px 'Barlow Condensed', sans-serif";
        ctx.fillText("ENDORSEMENT FLYER · ANKPA FEDERAL CONSTITUENCY · 2027", W / 2, 75);

        /* APC Logo */
        drawLogo(ctx, adcLogo, W / 2, 110, 80);

        /* Divider line */
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(100, 210); ctx.lineTo(W - 100, 210); ctx.stroke();

        /* "I ENDORSE" header */
        ctx.font = "800 28px 'Barlow Condensed', sans-serif";
        ctx.fillStyle = secondary;
        ctx.textAlign = "center";
        ctx.letterSpacing = "8px";
        ctx.fillText("I ENDORSE", W / 2, 250);
        ctx.letterSpacing = "0px";

        /* Rt. Hon. Abdullahi Ibrahim Ali — large */
        drawCirclePhoto(ctx, chiefPhoto, W / 2, 420, 140, accent, "Rt. Hon. Abdullahi Ibrahim Ali\nPHOTO");

        ctx.font = "900 italic 56px 'Playfair Display', serif";
        ctx.fillStyle = textPrimary;
        ctx.textAlign = "center";
        wrapText(ctx, "Rt. Hon. Abdullahi Ibrahim Ali (Halims)", W / 2, 610, W - 140, 56);

        ctx.font = "700 24px 'Barlow Condensed', sans-serif";
        ctx.fillStyle = accent;
        ctx.letterSpacing = "4px";
        ctx.fillText("FOR HOUSE OF REPRESENTATIVES", W / 2, 735);
        ctx.letterSpacing = "0px";

        /* Decorative bar */
        ctx.fillStyle = secondary;
        ctx.fillRect(W / 2 - 40, 760, 80, 4);

        /* Supporter section */
        ctx.font = "700 22px 'Barlow Condensed', sans-serif";
        ctx.fillStyle = textSecondary;
        ctx.letterSpacing = "5px";
        ctx.fillText("ENDORSED BY", W / 2, 810);
        ctx.letterSpacing = "0px";

        drawCirclePhoto(ctx, supporterPhoto, W / 2, 930, 90, secondary, "YOUR\nPHOTO");

        ctx.font = "900 italic 44px 'Playfair Display', serif";
        ctx.fillStyle = textPrimary;
        ctx.textAlign = "center";
        wrapText(ctx, userName || "Your Name Here", W / 2, 1070, W - 160, 48);

        if (userLocation) {
            ctx.font = "600 24px 'Barlow Condensed', sans-serif";
            ctx.fillStyle = textSecondary;
            ctx.fillText("📍 " + userLocation, W / 2, 1135);
        }

    } else if (id === "golden" || id === "patriot") {
        /* ══════════════════════════════════════════════════
           LAYOUT B: Side-by-side photos, bold political statement
           ══════════════════════════════════════════════════ */

        /* Top banner */
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, W, 85);
        ctx.font = "800 34px 'Barlow Condensed', sans-serif";
        ctx.fillStyle = isDark ? "#0A3020" : "#FFFFFF";
        ctx.textAlign = "center";
        ctx.letterSpacing = "5px";
        ctx.fillText("ALL PROGRESSIVES CONGRESS · APC", W / 2, 42);
        ctx.letterSpacing = "0px";
        ctx.font = "600 22px 'Barlow Condensed', sans-serif";
        ctx.fillText("ANKPA FEDERAL CONSTITUENCY · HOUSE OF REPRESENTATIVES · 2027", W / 2, 72);

        /* APC Logo */
        drawLogo(ctx, adcLogo, W / 2, 105, 70);

        /* Side-by-side photos */
        const photoY = 210, photoW = 400, photoH = 460;
        const gap = 40;
        const leftX = (W - photoW * 2 - gap) / 2;

        drawRectPhoto(ctx, chiefPhoto, leftX, photoY, photoW, photoH, 12, accent, "Rt. Hon. Abdullahi Ibrahim Ali PHOTO");
        drawRectPhoto(ctx, supporterPhoto, leftX + photoW + gap, photoY, photoW, photoH, 12, secondary, "YOUR PHOTO");

        // Labels under photos
        ctx.font = "700 20px 'Barlow Condensed', sans-serif";
        ctx.fillStyle = textSecondary;
        ctx.textAlign = "center";
        ctx.letterSpacing = "3px";
        ctx.fillText("CANDIDATE", leftX + photoW / 2, photoY + photoH + 40);
        ctx.fillText("SUPPORTER", leftX + photoW + gap + photoW / 2, photoY + photoH + 40);
        ctx.letterSpacing = "0px";

        /* Big candidate name */
        const nameY = photoY + photoH + 90;
        ctx.font = "900 italic 52px 'Playfair Display', serif";
        ctx.fillStyle = textPrimary;
        ctx.textAlign = "center";
        wrapText(ctx, "Rt. Hon. Abdullahi Ibrahim Ali (Halims)", W / 2, nameY, W - 140, 56);

        /* Supporter endorsement */
        ctx.fillStyle = secondary;
        ctx.fillRect(W / 2 - 60, nameY + 115, 120, 3);

        ctx.font = "700 22px 'Barlow Condensed', sans-serif";
        ctx.fillStyle = textSecondary;
        ctx.letterSpacing = "6px";
        ctx.textAlign = "center";
        ctx.fillText("PROUDLY ENDORSED BY", W / 2, nameY + 160);
        ctx.letterSpacing = "0px";

        ctx.font = "900 italic 46px 'Playfair Display', serif";
        ctx.fillStyle = accent;
        wrapText(ctx, userName || "Your Name Here", W / 2, nameY + 220, W - 160, 50);

        if (userLocation) {
            ctx.font = "600 24px 'Barlow Condensed', sans-serif";
            ctx.fillStyle = textSecondary;
            ctx.fillText("📍 " + userLocation, W / 2, nameY + 280);
        }

    } else if (id === "bold") {
        /* ══════════════════════════════════════════════════
           LAYOUT C: Dark dramatic — large chief photo with overlay
           ══════════════════════════════════════════════════ */

        /* Full dark gradient background */
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "#0A3020");
        grad.addColorStop(0.5, "#0D3D28");
        grad.addColorStop(1, "#0A3020");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        /* Accent top bar */
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, W, 8);

        /* APC Header */
        ctx.font = "800 32px 'Barlow Condensed', sans-serif";
        ctx.fillStyle = accent;
        ctx.textAlign = "center";
        ctx.letterSpacing = "8px";
        ctx.fillText("ALL PROGRESSIVES CONGRESS", W / 2, 55);
        ctx.letterSpacing = "0px";

        /* APC Logo */
        drawLogo(ctx, adcLogo, W / 2, 70, 75);

        /* Large Rt. Hon. Abdullahi Ibrahim Ali Photo — prominent */
        drawCirclePhoto(ctx, chiefPhoto, W / 2, 320, 170, accent, "Rt. Hon. Abdullahi Ibrahim Ali\nPHOTO");

        // Glow ring
        ctx.strokeStyle = accent + "30";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(W / 2, 320, 190, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(W / 2, 320, 200, 0, Math.PI * 2); ctx.stroke();

        /* Name */
        ctx.font = "900 italic 56px 'Playfair Display', serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        wrapText(ctx, "Rt. Hon. Abdullahi Ibrahim Ali (Halims)", W / 2, 550, W - 120, 60);

        ctx.font = "700 24px 'Barlow Condensed', sans-serif";
        ctx.fillStyle = accent;
        ctx.letterSpacing = "4px";
        ctx.fillText("HOUSE OF REPRESENTATIVES · 2027", W / 2, 680);
        ctx.letterSpacing = "0px";

        /* Divider */
        ctx.fillStyle = accent;
        ctx.fillRect(W / 2 - 50, 710, 100, 3);

        /* Supporter section */
        ctx.font = "700 22px 'Barlow Condensed', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.letterSpacing = "6px";
        ctx.fillText("ENDORSED BY", W / 2, 765);
        ctx.letterSpacing = "0px";

        drawCirclePhoto(ctx, supporterPhoto, W / 2, 870, 85, accent, "YOUR\nPHOTO");

        ctx.font = "900 italic 44px 'Playfair Display', serif";
        ctx.fillStyle = "#FFFFFF";
        wrapText(ctx, userName || "Your Name Here", W / 2, 1005, W - 160, 48);

        if (userLocation) {
            ctx.font = "600 24px 'Barlow Condensed', sans-serif";
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.fillText("📍 " + userLocation, W / 2, 1065);
        }

        /* Campaign slogan */
        ctx.font = "italic 28px 'Playfair Display', serif";
        ctx.fillStyle = accent;
        ctx.fillText("\"Prescribing a Better Future\"", W / 2, 1140);
    }

    /* ── BOTTOM BANNER (all templates) ── */
    const bannerH = 100;
    ctx.fillStyle = isDark ? accent : (id === "bold" ? accent : accent);
    ctx.fillRect(0, H - bannerH, W, bannerH);

    ctx.font = "800 26px 'Barlow Condensed', sans-serif";
    ctx.fillStyle = isDark ? "#0A3020" : "#FFFFFF";
    ctx.textAlign = "center";
    ctx.letterSpacing = "3px";
    ctx.fillText("VOTE APC · ANKPA FEDERAL CONSTITUENCY · 2027", W / 2, H - 62);
    ctx.letterSpacing = "0px";

    ctx.font = "600 18px 'Barlow Condensed', sans-serif";
    ctx.fillStyle = isDark ? "rgba(10,48,32,0.8)" : "rgba(255,255,255,0.8)";
    ctx.fillText("localhost:3000 · All Progressives Congress (APC)", W / 2, H - 36);

    ctx.font = "600 15px 'Barlow Condensed', sans-serif";
    ctx.fillStyle = isDark ? "rgba(10,48,32,0.55)" : "rgba(255,255,255,0.55)";
    ctx.fillText("Courtesy: HamisNetwork 4 Halims", W / 2, H - 14);

    /* ── Corner accents ── */
    ctx.strokeStyle = isDark ? accent + "60" : accent + "40";
    ctx.lineWidth = 3;
    const cm = 24;
    ctx.beginPath(); ctx.moveTo(cm, bannerH + cm + 20); ctx.lineTo(cm, bannerH + 10); ctx.lineTo(cm + 40, bannerH + 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - cm, bannerH + cm + 20); ctx.lineTo(W - cm, bannerH + 10); ctx.lineTo(W - cm - 40, bannerH + 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cm, H - bannerH - cm - 20); ctx.lineTo(cm, H - bannerH - 10); ctx.lineTo(cm + 40, H - bannerH - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - cm, H - bannerH - cm - 20); ctx.lineTo(W - cm, H - bannerH - 10); ctx.lineTo(W - cm - 40, H - bannerH - 10); ctx.stroke();
}


/* ══════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function EndorsementPageClient() {
    const revealRef = useRevealOnScroll();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const supporterInputRef = useRef<HTMLInputElement>(null);

    const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
    const [userName, setUserName] = useState("");
    const [userLocation, setUserLocation] = useState("");
    const [userPhone, setUserPhone] = useState("");
    const [supporterPhoto, setSupporterPhoto] = useState<HTMLImageElement | null>(null);
    const [supporterPreview, setSupporterPreview] = useState<string | null>(null);
    const [chiefPhoto, setChiefPhoto] = useState<HTMLImageElement | null>(null);
    const [adcLogo, setAdcLogo] = useState<HTMLImageElement | null>(null);
    const [nigeriaBg, setNigeriaBg] = useState<HTMLImageElement | null>(null);
    const [nassBg, setNassBg] = useState<HTMLImageElement | null>(null);
    const [igalaBg, setIgalaBg] = useState<HTMLImageElement | null>(null);
    const [generated, setGenerated] = useState(false);

    // Attempt to lookup the supporter ID based on the entered phone number
    const getReferralLink = async () => {
        let baseUrl = "https://localhost:3000/register?utm_source=flyer_viral&utm_medium=share";
        if (!userPhone) return baseUrl;

        try {
            const cleanPhone = userPhone.replace(/\s+/g, "");
            const { data } = await supabase.from("supporters").select("id").eq("phone", cleanPhone).single();
            if (data?.id) {
                return `${baseUrl}&ref=${data.id}`;
            }
        } catch (err) {
            // Ignore error, return default base url
        }
        return baseUrl;
    };

    /* Load Rt. Hon. Abdullahi Ibrahim Ali's photo, APC logo, and background images from public/images */
    useEffect(() => {
        const img1 = new Image();
        img1.onload = () => setChiefPhoto(img1);
        img1.src = "/images/halims-2.png";

        const img2 = new Image();
        img2.onload = () => setAdcLogo(img2);
        img2.src = "/images/apc-logo-1.png";

        const bgNig = new Image();
        bgNig.onload = () => setNigeriaBg(bgNig);
        bgNig.src = "/images/nigeria.png";

        const bgNass = new Image();
        bgNass.onload = () => setNassBg(bgNass);
        bgNass.src = "/images/nass.png";

        const bgIgala = new Image();
        bgIgala.onload = () => setIgalaBg(bgIgala);
        bgIgala.src = "/images/igala.png";
    }, []);

    /* Render preview whenever state changes */
    const refreshCanvas = useCallback(() => {
        if (!canvasRef.current) return;
        renderFlyer(canvasRef.current, selectedTemplate, supporterPhoto, chiefPhoto, adcLogo, userName, userLocation, nigeriaBg, nassBg, igalaBg);
    }, [selectedTemplate, supporterPhoto, chiefPhoto, adcLogo, userName, userLocation, nigeriaBg, nassBg, igalaBg]);

    useEffect(() => { refreshCanvas(); }, [refreshCanvas]);

    /* Handle supporter photo upload */
    const handleSupporterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => { setSupporterPhoto(img); setSupporterPreview(reader.result as string); };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    };

    /* Download flyer */
    const downloadFlyer = () => {
        if (!canvasRef.current) return;
        refreshCanvas();
        setGenerated(true);

        const canvas = canvasRef.current;
        const fileName = `Halims-Endorsement-${userName.replace(/\s+/g, "-") || "Flyer"}.png`;

        // Convert canvas to data URL then to binary blob for reliable download
        const dataUrl = canvas.toDataURL("image/png");
        const byteString = atob(dataUrl.split(",")[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: "image/png" });

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.setAttribute("download", fileName);
        document.body.appendChild(a);
        a.click();

        // Cleanup after a short delay
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 500);

        // Track flyer generation
        supabase.from("flyer_logs").insert([{
            supporter_name: userName || "Anonymous",
            template: selectedTemplate.name,
        }]).then(() => { });
    };

    /* Share (Web Share API) */
    const shareFlyer = async () => {
        if (!canvasRef.current) return;
        refreshCanvas();
        try {
            const link = await getReferralLink();
            const blob = await new Promise<Blob>((resolve) => canvasRef.current!.toBlob((b) => resolve(b!), "image/png"));
            const file = new File([blob], "endorsement-flyer.png", { type: "image/png" });
            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: "I Support Rt. Hon. Abdullahi Ibrahim Ali — APC",
                    text: `I endorse Rt. Hon. Abdullahi Ibrahim Ali (Halims) for House of Representatives! Vote APC! Register your support: ${link}`,
                    files: [file],
                });
            } else {
                // Fallback: WhatsApp pre-filled share link
                const msg = encodeURIComponent(`I endorse Rt. Hon. Abdullahi Ibrahim Ali (Halims) for House of Representatives! 🗳️ Vote APC!\n\n📸 Create your own endorsement flyer: https://localhost:3000/endorsement\n✍️ Register your support: ${link}\n\n#VoteGONE #APC2027`);
                window.open(`https://wa.me/?text=${msg}`, '_blank');
            }
        } catch { downloadFlyer(); }
    };

    return (
        <div ref={revealRef}>
            <Navbar />

            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <p className={styles.heroEyebrow}>Show Your Support</p>
                    <h1 className={styles.heroTitle}>Create Your<br /><em>Endorsement Flyer</em></h1>
                    <p className={styles.heroDesc}>Upload your photo, pick a stunning design, and generate a personalised APC campaign flyer featuring you and Rt. Hon. Abdullahi Ibrahim Ali.</p>
                </div>
            </section>

            {/* Generator */}
            <section className={styles.generatorSection}>
                <div className="container">
                    <div className={styles.generatorGrid}>
                        {/* Controls */}
                        <div className={`${styles.controls} reveal`}>
                            {/* Step 1: Your Photo */}
                            <div className={styles.step}>
                                <div className={styles.stepHeader}>
                                    <span className={styles.stepNum}>1</span>
                                    <h3 className={styles.stepTitle}>Upload Your Photo</h3>
                                </div>
                                <div className={styles.uploadArea} onClick={() => supporterInputRef.current?.click()}>
                                    {supporterPreview ? (
                                        <img src={supporterPreview} alt="Your photo" className={styles.uploadPreview} />
                                    ) : (
                                        <div className={styles.uploadPlaceholder}>
                                            <span className={styles.uploadIcon}>📸</span>
                                            <p className={styles.uploadText}>Click to upload or take a selfie</p>
                                            <p className={styles.uploadHint}>JPG, PNG — Square crop recommended</p>
                                        </div>
                                    )}
                                    <input ref={supporterInputRef} type="file" accept="image/*" onChange={handleSupporterUpload} className={styles.fileInput} />
                                </div>
                                {supporterPreview && (
                                    <button className={styles.removeBtn} onClick={() => { setSupporterPhoto(null); setSupporterPreview(null); if (supporterInputRef.current) supporterInputRef.current.value = ""; }}>
                                        ✕ Remove Photo
                                    </button>
                                )}
                            </div>

                            {/* Step 2: Name & Location */}
                            <div className={styles.step}>
                                <div className={styles.stepHeader}>
                                    <span className={styles.stepNum}>2</span>
                                    <h3 className={styles.stepTitle}>Your Details</h3>
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Full Name *</label>
                                    <input type="text" className={styles.input} placeholder="e.g. Amina Idris" value={userName} onChange={(e) => setUserName(e.target.value)} />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Location (optional)</label>
                                    <input type="text" className={styles.input} placeholder="e.g. Ankpa, Kogi State" value={userLocation} onChange={(e) => setUserLocation(e.target.value)} />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Phone Number (For Tracking Referrals)</label>
                                    <input type="tel" className={styles.input} placeholder="Used to track your invited supporters" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} />
                                </div>
                            </div>

                            {/* Step 3: Template */}
                            <div className={styles.step}>
                                <div className={styles.stepHeader}>
                                    <span className={styles.stepNum}>3</span>
                                    <h3 className={styles.stepTitle}>Choose a Design</h3>
                                </div>
                                <div className={styles.templateGrid}>
                                    {templates.map((t) => (
                                        <button key={t.id} className={`${styles.templateBtn} ${selectedTemplate.id === t.id ? styles.templateActive : ""}`} onClick={() => setSelectedTemplate(t)} >
                                            <div className={styles.templatePreview} style={{ background: t.preview }} />
                                            <span className={styles.templateName}>{t.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Info */}
                            <div className={styles.infoBox}>
                                <p>📌 <strong>Rt. Hon. Abdullahi Ibrahim Ali&apos;s photo</strong> and <strong>APC party logo</strong> are automatically included. Just upload your photo, enter your name, and download!</p>
                            </div>

                            {/* Actions */}
                            <div className={styles.actions}>
                                <button className={`btn-primary ${styles.downloadBtn}`} onClick={downloadFlyer} disabled={!userName}>
                                    ⬇️ Download Flyer
                                </button>
                                <button className={`btn-outline ${styles.shareBtn}`} onClick={shareFlyer} disabled={!userName} style={{ color: "var(--green-deep)", borderColor: "var(--green-deep)" }}>
                                    📤 Share to Social
                                </button>
                            </div>

                            {generated && (
                                <div className={styles.successMsg}>
                                    ✅ Flyer generated! Share it on WhatsApp, Facebook, Instagram & Twitter. #VoteGONE #APC2027
                                </div>
                            )}
                        </div>

                        {/* Live Preview */}
                        <div className={`${styles.previewCol} reveal reveal-delay-2`}>
                            <div className={styles.previewHeader}>
                                <span className={styles.previewLabel}>Live Preview</span>
                                <span className={styles.previewSize}>1080 × 1350</span>
                            </div>
                            <div className={styles.canvasWrap}>
                                <canvas ref={canvasRef} className={styles.canvas} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Counter */}
            <section className={styles.counterSection}>
                <div className="container">
                    <div className={styles.counterInner}>
                        <div>
                            <LiveStatsCounter />
                            <span className={styles.counterLabel}>Verified Supporters</span>
                        </div>
                        <div className={styles.counterDivider} />
                        <div>
                            <span className={styles.counterNum}>↑ Live</span>
                            <span className={styles.counterLabel}>&amp; Growing Daily</span>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

function LiveStatsCounter() {
    const [count, setCount] = useState(1247); // Base mock count
    useEffect(() => {
        const fetchStats = async () => {
            const { count: dbCount, error } = await supabase.from('supporters').select('*', { count: 'exact', head: true });
            if (!error && dbCount !== null) {
                setCount(1247 + dbCount);
            }
        };
        fetchStats();
    }, []);
    return <span className={styles.counterNum}>{count.toLocaleString()}</span>;
}
