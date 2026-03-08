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
    { id: "senate_crimson", name: "Red Chamber", preview: "linear-gradient(135deg, #8B0000, #C4000C)", bg: "#8B0000", accent: "#C9A227", secondary: "#FFFFFF", textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.85)" },
    { id: "nass_prestige", name: "NASS Prestige", preview: "linear-gradient(135deg, #0A0A0A, #C9A227)", bg: "#F8F5EE", accent: "#0A0A0A", secondary: "#C4000C", textPrimary: "#1A1A1A", textSecondary: "#333333" },
    { id: "golden_mandate", name: "Golden Mandate", preview: "linear-gradient(135deg, #C9A227, #FFFFFF)", bg: "#FFF9E6", accent: "#8B0000", secondary: "#0A3020", textPrimary: "#1A1A1A", textSecondary: "#666666" },
    { id: "glass_chamber", name: "Glass Chamber", preview: "linear-gradient(135deg, #0A3020, #C4000C)", bg: "#0D3524", accent: "#C9A227", secondary: "#FFFFFF", textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.7)" },
    { id: "modern_apc", name: "Modern APC", preview: "linear-gradient(135deg, #1A1A1E, #3b82f6)", bg: "#1A1A1E", accent: "#3b82f6", secondary: "#C4000C", textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.6)" },
    { id: "premium_halims", name: "Premium Onyx", preview: "linear-gradient(135deg, #000000, #C9A227)", bg: "#050505", accent: "#C9A227", secondary: "#C4000C", textPrimary: "#FFFFFF", textSecondary: "#C9A227" },
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

    const { accent, secondary, id } = template;
    const senateLogo = igalaBg;

    /* ── Helper: draw photo covering a rectangular area ── */
    const drawCoverPhoto = (img: HTMLImageElement | null, x: number, y: number, w: number, h: number) => {
        if (!img) return;
        ctx.save();
        ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
        const aspect = img.width / img.height;
        let dw = w, dh = h;
        if (aspect > w / h) { dh = h; dw = h * aspect; } else { dw = w; dh = w / aspect; }
        ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
        ctx.restore();
    };

    /* ════════════════════════════════════════════════════════════════
       1. RED CHAMBER — Full-Bleed Candidate Hero
       Candidate photo fills the entire top 65%, with a dramatic
       crimson-to-black gradient overlay. Text sits on the overlay.
       Supporter card floats at the bottom.
       ════════════════════════════════════════════════════════════════ */
    if (id === "senate_crimson") {
        // Full-bleed candidate photo
        drawCoverPhoto(chiefPhoto, 0, 0, W, 900);
        // Gradient overlay: transparent top → crimson → black bottom
        const ov = ctx.createLinearGradient(0, 0, 0, 900);
        ov.addColorStop(0, "rgba(139,0,0,0.15)");
        ov.addColorStop(0.4, "rgba(139,0,0,0.55)");
        ov.addColorStop(1, "rgba(0,0,0,0.92)");
        ctx.fillStyle = ov;
        ctx.fillRect(0, 0, W, 900);
        // Dark bottom zone
        ctx.fillStyle = "#0A0A0A";
        ctx.fillRect(0, 900, W, H - 900);

        // Senate + APC logos (top)
        drawLogo(ctx, senateLogo, W / 2 - 80, 30, 60);
        drawLogo(ctx, adcLogo, W / 2 + 80, 35, 55);

        // Candidate name (over the photo)
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 italic 72px 'Playfair Display', serif";
        ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 20;
        wrapText(ctx, "Rt. Hon. Halims", W / 2, 720, W - 120, 80);
        ctx.shadowBlur = 0;

        // Gold tagline
        ctx.fillStyle = "#C9A227";
        ctx.font = "800 22px 'Inter', sans-serif";
        ctx.letterSpacing = "5px";
        ctx.fillText("KOGI EAST SENATE • 2027", W / 2, 860);

        // Supporter endorsement card
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        roundRect(ctx, 60, 930, W - 120, 280, 20);
        ctx.fill();
        ctx.strokeStyle = "rgba(201,162,39,0.3)";
        ctx.lineWidth = 1; ctx.stroke();

        drawCirclePhoto(ctx, supporterPhoto, 200, 1070, 95, "#C9A227", "Your\nPhoto");

        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "700 16px 'Inter', sans-serif";
        ctx.letterSpacing = "4px";
        ctx.fillText("PROUDLY ENDORSED BY", 330, 1010);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 40px 'Playfair Display', serif";
        wrapText(ctx, (userName || "Your Name").toUpperCase(), 330, 1060, W - 440, 48, "left");

        if (userLocation) {
            ctx.fillStyle = "#C9A227";
            ctx.font = "500 18px 'Inter', sans-serif";
            ctx.fillText("📍 " + userLocation, 330, 1140);
        }
    }

    /* ════════════════════════════════════════════════════════════════
       2. THE VISIONARY PATRIOT (Replaces NASS Prestige)
       Authentic Nigerian Political Style: Green-White-Green waves,
       massive background text, and maximalist overlapping elements.
       ════════════════════════════════════════════════════════════════ */
    else if (id === "nass_prestige") {
        ctx.fillStyle = "#005a36"; // Deep NASS Green
        ctx.fillRect(0, 0, W, H);
        
        // Large dark red angular sweep
        ctx.fillStyle = "#8b0000"; // Deep Senate Red
        ctx.beginPath();
        ctx.moveTo(0, H * 0.4);
        ctx.lineTo(W, H * 0.1);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.fill();
        
        // White line separator
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, H * 0.4);
        ctx.lineTo(W, H * 0.1);
        ctx.stroke();

        // Overlay candidate on right side
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(W * 0.3, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(W * 0.3, H);
        ctx.clip();
        drawCoverPhoto(chiefPhoto, W * 0.3, 100, W * 0.7, 800);
        
        const grad = ctx.createLinearGradient(W * 0.3, 0, W * 0.6, 0);
        grad.addColorStop(0, "rgba(139, 0, 0, 1)");
        grad.addColorStop(1, "rgba(139, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(W * 0.3, 100, W * 0.7, 800);
        ctx.restore();

        drawLogo(ctx, senateLogo, 100, 60, 80);
        drawLogo(ctx, adcLogo, 220, 65, 75);

        ctx.textAlign = "left";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 italic 72px 'Playfair Display', serif";
        wrapText(ctx, "Rt. Hon. Halims", 60, 480, W * 0.6, 80, "left");
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 24px 'Inter', sans-serif";
        ctx.letterSpacing = "6px";
        ctx.fillText("FOR SENATE 2027", 65, 600);
        ctx.letterSpacing = "0px";

        // Supporter Card
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1;
        roundRect(ctx, 50, 800, W - 100, 250, 20);
        ctx.fill(); ctx.stroke();

        drawCirclePhoto(ctx, supporterPhoto, 180, 925, 85, "#FFFFFF", "Photo");

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "700 16px 'Inter', sans-serif";
        ctx.letterSpacing = "4px";
        ctx.fillText("PROUDLY ENDORSED BY", 300, 880);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 42px 'Inter', sans-serif";
        wrapText(ctx, (userName || "Your Name").toUpperCase(), 300, 930, W - 400, 48, "left");

        if (userLocation) {
            ctx.fillStyle = "#C9A227"; // Gold accent for location
            ctx.font = "600 20px 'Inter', sans-serif";
            ctx.fillText("📍 " + userLocation, 300, 1000);
        }
    }

    /* ════════════════════════════════════════════════════════════════
       3. THE MANDATE 2027 (Replaces Golden Mandate)
       APC Tri-color ribbon sweeping across a dark blue canvas.
       Heavy 3D-styled typography behind the candidate.
       ════════════════════════════════════════════════════════════════ */
    else if (id === "golden_mandate") {
        // Top half senate red, bottom half NASS green
        ctx.fillStyle = "#8b0000";
        ctx.fillRect(0, 0, W, H / 2);
        ctx.fillStyle = "#005a36";
        ctx.fillRect(0, H / 2, W, H / 2);
        
        // Massive white text overlapping the center
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 120px 'Playfair Display', serif";
        ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 15;
        ctx.fillText("HALIMS", W / 2, H / 2 + 20);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 24px 'Inter', sans-serif";
        ctx.letterSpacing = "8px";
        ctx.fillText("FOR SENATE 2027", W / 2, H / 2 + 80);

        // Candidate photo top center
        drawCoverPhoto(chiefPhoto, W / 2 - 250, 50, 500, H / 2 - 100);
        // Fade the photo smoothly into the red
        const ov = ctx.createLinearGradient(0, H / 2 - 200, 0, H / 2 - 50);
        ov.addColorStop(0, "rgba(139, 0, 0, 0)");
        ov.addColorStop(1, "rgba(139, 0, 0, 1)");
        ctx.fillStyle = ov;
        ctx.fillRect(0, H / 2 - 200, W, 150);

        drawLogo(ctx, senateLogo, 120, 80, 80);
        drawLogo(ctx, adcLogo, W - 120, 85, 75);

        // Supporter Card bottom center
        drawCirclePhoto(ctx, supporterPhoto, W / 2, H / 2 + 260, 100, "#FFFFFF", "Photo");

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "700 16px 'Inter', sans-serif";
        ctx.letterSpacing = "4px";
        ctx.fillText("I STAND WITH THE MANDATE", W / 2, H / 2 + 410);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 38px 'Inter', sans-serif";
        let snY = wrapText(ctx, (userName || "Your Name").toUpperCase(), W / 2, H / 2 + 460, W - 200, 44);

        if (userLocation) {
            ctx.fillStyle = "#C9A227";
            ctx.font = "600 20px 'Inter', sans-serif";
            ctx.fillText("📍 " + userLocation, W / 2, snY + 40);
        }
    }

    /* ════════════════════════════════════════════════════════════════
       4. THE GRASSROOTS MOBILIZER (Replaces Modern APC)
       Rugged, textured, halftone look typical of on-the-ground posters.
       Stark contrast, polaroid frames, stamped type.
       ════════════════════════════════════════════════════════════════ */
    else if (id === "modern_apc") {
        // Base: Off-white canvas
        ctx.fillStyle = "#F4F1E9";
        ctx.fillRect(0, 0, W, H);

        // Halftone / Grid simulation (Drawing thick dots in background)
        ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
        for (let y = 0; y < H; y += 20) {
            for (let x = 0; x < W; x += 20) {
                ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
            }
        }

        // Giant Red Brush Stroke for candidate name background
        ctx.fillStyle = "#C4000C"; // Use precise red
        ctx.beginPath();
        ctx.moveTo(-50, 550); ctx.lineTo(W + 50, 520); ctx.lineTo(W + 50, 720); ctx.lineTo(-50, 680);
        ctx.fill();

        // Candidate Photo in a tilted polaroid frame
        ctx.save();
        ctx.translate(W / 2 + 100, 280);
        ctx.rotate(4 * Math.PI / 180);
        
        ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 25; ctx.shadowOffsetY = 15;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(-320, -220, 640, 700);
        ctx.shadowColor = "transparent";
        
        drawCoverPhoto(chiefPhoto, -300, -200, 600, 600);
        
        // "VOTE" stamped on polaroid
        ctx.fillStyle = "#005a36"; // NASS Green instead of navy
        ctx.font = "900 60px 'Inter', sans-serif";
        ctx.fillText("HALIMS", 0, 450);
        ctx.restore();

        // Logos (Top Left)
        drawLogo(ctx, senateLogo, 100, 80, 90);
        drawLogo(ctx, adcLogo, 230, 85, 80);

        // Bold Typography over the red brush stroke
        ctx.textAlign = "left";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 italic 72px 'Playfair Display', serif";
        ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 10;
        wrapText(ctx, "Halims for Senate", 60, 610, W - 120, 76, "left");
        ctx.shadowColor = "transparent";

        // Supporter Section overlapping from bottom left
        ctx.save();
        ctx.translate(220, 950);
        ctx.rotate(-3 * Math.PI / 180);
        
        ctx.shadowColor = "rgba(0,0,0,0.2)"; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(-160, -180, 320, 380);
        ctx.shadowColor = "transparent";
        
        drawCoverPhoto(supporterPhoto, -140, -160, 280, 280);
        ctx.restore();

        // Stamped Supporter Text on the right
        ctx.fillStyle = "#005a36"; // Green Text
        ctx.font = "900 20px 'Inter', sans-serif";
        ctx.letterSpacing = "4px";
        ctx.fillText("VETTED BY THE GRASSROOTS:", 420, 880);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#C4000C"; // Red Text
        ctx.font = "900 44px 'Inter', sans-serif";
        let snY = wrapText(ctx, (userName || "Your Name").toUpperCase(), 420, 930, W - 460, 48, "left");

        if (userLocation) {
            ctx.fillStyle = "#005a36";
            ctx.font = "700 22px 'Inter', sans-serif";
            ctx.fillText(userLocation.toUpperCase() + " WARD", 420, snY + 40);
        }
    }

    /* ════════════════════════════════════════════════════════════════
       4. THE ELITE STATESMAN (premium_halims)
       Solid Navy Blue, enormous subtle gold senate seal watermark,
       Elegant serif typography, gold foil accents, massive negative space.
       ════════════════════════════════════════════════════════════════ */
    else {
        // Deep Green Base with subtle texture
        ctx.fillStyle = "#004d2e";
        ctx.fillRect(0, 0, W, H);
        
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 2;
        for (let i = 0; i < W; i += 30) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(0, i); ctx.stroke();
        }

        // Thick Red glowing borders
        ctx.strokeStyle = "#C4000C";
        ctx.lineWidth = 15;
        ctx.strokeRect(30, 30, W - 60, H - 160); // Leaves room for banner
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#FFFFFF";
        ctx.strokeRect(50, 50, W - 100, H - 200);

        ctx.textAlign = "center";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 italic 80px 'Playfair Display', serif";
        ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 15;
        ctx.fillText("Halims for Senate", W / 2, 180);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#C9A227";
        ctx.font = "700 20px 'Inter', sans-serif";
        ctx.letterSpacing = "8px";
        ctx.fillText("2027 OFFICIAL DECLARATION", W / 2, 240);

        // Candidate photo
        drawCoverPhoto(chiefPhoto, W / 2 - 350, 280, 700, 650);
        const grad = ctx.createLinearGradient(0, 750, 0, 930);
        grad.addColorStop(0, "rgba(0, 77, 46, 0)");
        grad.addColorStop(1, "rgba(0, 77, 46, 1)");
        ctx.fillStyle = grad;
        ctx.fillRect(W / 2 - 350, 750, 700, 180);

        drawLogo(ctx, senateLogo, 100, 90, 80);
        drawLogo(ctx, adcLogo, W - 100, 95, 75);

        // Small supporter floating badge
        const supX = 180;
        const supY = 880;
        
        drawCirclePhoto(ctx, supporterPhoto, supX, supY, 80, "#C4000C", "Photo");
        
        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "600 16px 'Inter', sans-serif";
        ctx.letterSpacing = "4px";
        ctx.fillText("ENDORSED BY", 280, 850);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 32px 'Inter', sans-serif";
        wrapText(ctx, (userName || "Your Name").toUpperCase(), 280, 890, W - 400, 36, "left");

        if (userLocation) {
            ctx.fillStyle = "#C9A227";
            ctx.font = "500 18px 'Inter', sans-serif";
            ctx.fillText("📍 " + userLocation, 280, 940);
        }
    }

    /* ── BOTTOM BANNER (all templates) ── */
    const bannerH = 100;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, H - bannerH, W, bannerH);
    // Gold top line
    ctx.fillStyle = "#C9A227";
    ctx.fillRect(0, H - bannerH, W, 3);

    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 24px 'Inter', sans-serif";
    ctx.letterSpacing = "3px";
    ctx.fillText("VOTE APC • KOGI EAST SENATE • 2027", W / 2, H - 55);
    ctx.letterSpacing = "0px";

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "500 14px 'Inter', sans-serif";
    ctx.fillText("Powered by HamisNetwork 4 Halims", W / 2, H - 25);
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
        img1.src = "/images/halims4.png";

        const img2 = new Image();
        img2.onload = () => setAdcLogo(img2);
        img2.src = "/images/apc-logo.png";

        const bgNig = new Image();
        bgNig.onload = () => setNigeriaBg(bgNig);
        bgNig.src = "/images/nigeria.png";

        const bgNass = new Image();
        bgNass.onload = () => setNassBg(bgNass);
        bgNass.src = "/images/nass.png";

        const senateLogoImg = new Image();
        senateLogoImg.onload = () => setIgalaBg(senateLogoImg); // Reusing igalaBg slot for Senate Logo to avoid adding new state
        senateLogoImg.src = "/images/senate-logo.png";
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
                                <button className={`btn-outline ${styles.shareBtn}`} onClick={shareFlyer} disabled={!userName} style={{ color: "var(--blue-deep)", borderColor: "var(--blue-deep)" }}>
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
