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
        ctx.font = "900 italic 60px 'Playfair Display', serif";
        ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 20;
        wrapText(ctx, "Rt. Hon. (Dr.) Abdullahi Ibrahim Ali", W / 2, 720, W - 120, 68);
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
       2. NASS PRESTIGE — Magazine Cover
       Full-bleed candidate as background, with warm champagne overlay.
       Large white text card overlapping from the bottom.
       ════════════════════════════════════════════════════════════════ */
    else if (id === "nass_prestige") {
        // Full-bleed candidate
        drawCoverPhoto(chiefPhoto, 0, 0, W, 780);
        // Warm overlay
        const ov = ctx.createLinearGradient(0, 0, 0, 780);
        ov.addColorStop(0, "rgba(248,245,238,0.1)");
        ov.addColorStop(0.6, "rgba(248,245,238,0.3)");
        ov.addColorStop(1, "rgba(248,245,238,0.95)");
        ctx.fillStyle = ov;
        ctx.fillRect(0, 0, W, 780);

        // Bottom section: solid cream
        ctx.fillStyle = "#F8F5EE";
        ctx.fillRect(0, 780, W, H - 780);

        // Magazine masthead
        ctx.textAlign = "left";
        ctx.fillStyle = "#0A0A0A";
        ctx.font = "900 72px 'Playfair Display', serif";
        ctx.fillText("HALIMS", 70, 100);
        ctx.fillStyle = "#C4000C";
        ctx.font = "700 18px 'Inter', sans-serif";
        ctx.letterSpacing = "3px";
        ctx.fillText("KOGI EAST SENATE  •  2027", 75, 130);
        ctx.letterSpacing = "0px";

        // Logos top-right
        drawLogo(ctx, senateLogo, W - 150, 40, 65);
        drawLogo(ctx, adcLogo, W - 70, 45, 55);

        // Floating white card
        ctx.shadowColor = "rgba(0,0,0,0.12)";
        ctx.shadowBlur = 40; ctx.shadowOffsetY = 10;
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, 70, 660, W - 140, 520, 24);
        ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        // Gold accent line at top of card
        ctx.fillStyle = "#C9A227";
        ctx.fillRect(70, 660, W - 140, 5);

        // Candidate info inside card
        ctx.textAlign = "center";
        ctx.fillStyle = "#0A0A0A";
        ctx.font = "900 italic 46px 'Playfair Display', serif";
        wrapText(ctx, "Rt. Hon. (Dr.) Abdullahi Ibrahim Ali", W / 2, 730, W - 220, 54);

        ctx.fillStyle = "#C4000C";
        ctx.font = "700 18px 'Inter', sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText("DEPUTY MAJORITY LEADER → SENATE", W / 2, 850);
        ctx.letterSpacing = "0px";

        // Divider
        ctx.fillStyle = "#E8E0D0";
        ctx.fillRect(200, 890, W - 400, 1);

        // Supporter section inside card
        drawCirclePhoto(ctx, supporterPhoto, 220, 1010, 75, "#0A0A0A", "Your\nPhoto");

        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.font = "700 15px 'Inter', sans-serif";
        ctx.letterSpacing = "4px";
        ctx.fillText("ENDORSED BY", 320, 960);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#0A0A0A";
        ctx.font = "800 36px 'Playfair Display', serif";
        wrapText(ctx, (userName || "Your Name").toUpperCase(), 320, 1010, W - 460, 44, "left");

        if (userLocation) {
            ctx.fillStyle = "#C4000C";
            ctx.font = "500 18px 'Inter', sans-serif";
            ctx.fillText("📍 " + userLocation, 320, 1085);
        }
    }

    /* ════════════════════════════════════════════════════════════════
       3. GOLDEN MANDATE — Diagonal Split
       A bold diagonal line divides the canvas. Candidate on top-left,
       supporter on bottom-right. Golden accent stripe in the middle.
       ════════════════════════════════════════════════════════════════ */
    else if (id === "golden_mandate") {
        // Rich warm base
        ctx.fillStyle = "#FFF9E6";
        ctx.fillRect(0, 0, W, H);

        // Candidate photo fills upper-left triangle
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(0, H); ctx.closePath();
        ctx.clip();
        drawCoverPhoto(chiefPhoto, 0, 0, W, H);
        // Dark overlay on candidate side
        const ov1 = ctx.createLinearGradient(0, 0, W * 0.7, H * 0.7);
        ov1.addColorStop(0, "rgba(0,0,0,0.1)");
        ov1.addColorStop(1, "rgba(0,0,0,0.6)");
        ctx.fillStyle = ov1;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        // Supporter photo fills lower-right triangle
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
        ctx.clip();
        drawCoverPhoto(supporterPhoto, 0, 0, W, H);
        const ov2 = ctx.createLinearGradient(W * 0.3, H * 0.3, W, H);
        ov2.addColorStop(0, "rgba(139,0,0,0.4)");
        ov2.addColorStop(1, "rgba(139,0,0,0.85)");
        ctx.fillStyle = ov2;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        // Gold diagonal stripe
        ctx.fillStyle = "#C9A227";
        ctx.beginPath();
        ctx.moveTo(W + 20, -20); ctx.lineTo(W + 40, -20); ctx.lineTo(-20, H + 40); ctx.lineTo(-40, H + 20);
        ctx.closePath(); ctx.fill();
        // Thinner white companion stripe
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.beginPath();
        ctx.moveTo(W + 45, -20); ctx.lineTo(W + 55, -20); ctx.lineTo(-15, H + 40); ctx.lineTo(-25, H + 30);
        ctx.closePath(); ctx.fill();

        // Candidate name (upper-left zone)
        ctx.textAlign = "left";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 italic 52px 'Playfair Display', serif";
        ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 15;
        wrapText(ctx, "Rt. Hon. (Dr.) Abdullahi Ibrahim Ali", 70, 120, 500, 62, "left");
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#C9A227";
        ctx.font = "800 20px 'Inter', sans-serif";
        ctx.letterSpacing = "3px";
        ctx.fillText("KOGI EAST SENATE • 2027", 70, 320);
        ctx.letterSpacing = "0px";

        // Logos
        drawLogo(ctx, senateLogo, 150, 380, 80);
        drawLogo(ctx, adcLogo, 300, 385, 70);

        // Supporter name (lower-right zone)
        ctx.textAlign = "right";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 17px 'Inter', sans-serif";
        ctx.letterSpacing = "5px";
        ctx.fillText("ENDORSED BY", W - 70, 950);
        ctx.letterSpacing = "0px";

        ctx.font = "800 48px 'Playfair Display', serif";
        ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 10;
        wrapText(ctx, (userName || "Your Name").toUpperCase(), W - 70, 1010, 550, 56, "right");
        ctx.shadowBlur = 0;

        if (userLocation) {
            ctx.fillStyle = "#C9A227";
            ctx.font = "500 20px 'Inter', sans-serif";
            ctx.textAlign = "right";
            ctx.fillText("📍 " + userLocation, W - 70, 1130);
        }
    }

    /* ════════════════════════════════════════════════════════════════
       4. GLASS CHAMBER — Cinematic Letterbox
       Full-bleed candidate photo with a heavy dark overlay.
       A thick horizontal "letterbox" band across the center contains
       all text. Supporter circle floats in the lower third.
       ════════════════════════════════════════════════════════════════ */
    else if (id === "glass_chamber") {
        // Full-bleed candidate
        drawCoverPhoto(chiefPhoto, 0, 0, W, H);
        // Dark cinematic overlay
        const ov = ctx.createLinearGradient(0, 0, 0, H);
        ov.addColorStop(0, "rgba(13,53,36,0.7)");
        ov.addColorStop(0.5, "rgba(0,0,0,0.85)");
        ov.addColorStop(1, "rgba(13,53,36,0.95)");
        ctx.fillStyle = ov;
        ctx.fillRect(0, 0, W, H);

        // Letterbox band (glassmorphism)
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fillRect(0, 380, W, 350);
        ctx.strokeStyle = "rgba(201,162,39,0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, 380); ctx.lineTo(W, 380); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 730); ctx.lineTo(W, 730); ctx.stroke();

        // Top zone: logos + tagline
        drawLogo(ctx, senateLogo, W / 2, 60, 100);
        ctx.textAlign = "center";
        ctx.fillStyle = "#C9A227";
        ctx.font = "800 22px 'Inter', sans-serif";
        ctx.letterSpacing = "8px";
        ctx.fillText("NIGERIAN SENATE", W / 2, 200);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "500 16px 'Inter', sans-serif";
        ctx.letterSpacing = "4px";
        ctx.fillText("KOGI EAST SENATORIAL DISTRICT", W / 2, 235);
        ctx.letterSpacing = "0px";
        drawLogo(ctx, adcLogo, W / 2, 270, 60);

        // Inside letterbox: candidate name
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 italic 64px 'Playfair Display', serif";
        wrapText(ctx, "Rt. Hon. (Dr.) Abdullahi Ibrahim Ali", W / 2, 460, W - 140, 72);

        ctx.fillStyle = "#C9A227";
        ctx.font = "800 24px 'Inter', sans-serif";
        ctx.letterSpacing = "6px";
        ctx.fillText("THE PEOPLE'S MANDATE • 2027", W / 2, 680);
        ctx.letterSpacing = "0px";

        // Supporter zone
        drawCirclePhoto(ctx, supporterPhoto, W / 2, 880, 100, "#C9A227", "Your\nPhoto");
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(W / 2, 880, 115, 0, Math.PI * 2); ctx.stroke();

        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "700 16px 'Inter', sans-serif";
        ctx.letterSpacing = "5px";
        ctx.fillText("PROUDLY ENDORSED BY", W / 2, 1020);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 42px 'Playfair Display', serif";
        let eY = wrapText(ctx, (userName || "Your Name").toUpperCase(), W / 2, 1070, W - 200, 50);

        if (userLocation) {
            ctx.fillStyle = "#C9A227";
            ctx.font = "500 18px 'Inter', sans-serif";
            ctx.fillText("📍 " + userLocation, W / 2, eY + 35);
        }
    }

    /* ════════════════════════════════════════════════════════════════
       5. MODERN APC — Bold Stacked Panels
       Three horizontal panels stacked vertically:
       Top panel (blue): Candidate photo + name
       Mid panel (red accent stripe)
       Bottom panel (dark): Supporter photo + endorsement
       ════════════════════════════════════════════════════════════════ */
    else if (id === "modern_apc") {
        // Top panel: dark blue-gray with candidate photo
        const topH = 620;
        ctx.fillStyle = "#12141C";
        ctx.fillRect(0, 0, W, topH);
        // Candidate photo on left half
        drawCoverPhoto(chiefPhoto, 0, 0, W / 2 + 40, topH);
        // Gradient fade from photo to dark panel
        const fadeR = ctx.createLinearGradient(W / 2 - 100, 0, W / 2 + 100, 0);
        fadeR.addColorStop(0, "rgba(18,20,28,0)");
        fadeR.addColorStop(1, "rgba(18,20,28,1)");
        ctx.fillStyle = fadeR;
        ctx.fillRect(W / 2 - 100, 0, 200, topH);
        // Right side text
        ctx.fillStyle = "#12141C";
        ctx.fillRect(W / 2 + 40, 0, W / 2 - 40, topH);

        // Logos
        drawLogo(ctx, senateLogo, W - 160, 40, 55);
        drawLogo(ctx, adcLogo, W - 80, 45, 50);

        // Candidate text on right
        ctx.textAlign = "left";
        ctx.fillStyle = accent; // blue
        ctx.font = "800 18px 'Inter', sans-serif";
        ctx.letterSpacing = "5px";
        ctx.fillText("SENATORIAL CANDIDATE", W / 2 + 70, 180);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 italic 48px 'Playfair Display', serif";
        wrapText(ctx, "Rt. Hon. (Dr.) Abdullahi Ibrahim Ali", W / 2 + 70, 240, W / 2 - 140, 56, "left");

        ctx.fillStyle = accent;
        ctx.fillRect(W / 2 + 70, 430, 80, 4);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "600 18px 'Inter', sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText("KOGI EAST • 2027", W / 2 + 70, 480);
        ctx.fillText("ALL PROGRESSIVES CONGRESS", W / 2 + 70, 510);
        ctx.letterSpacing = "0px";

        // Red accent stripe
        ctx.fillStyle = "#C4000C";
        ctx.fillRect(0, topH, W, 12);

        // Bottom panel: dark with supporter
        ctx.fillStyle = "#0A0A0C";
        ctx.fillRect(0, topH + 12, W, H - topH - 12);

        // Supporter photo on right
        drawCoverPhoto(supporterPhoto, W / 2 + 40, topH + 12, W / 2 - 40, H - topH - 12 - 100);
        const fadeL = ctx.createLinearGradient(W / 2 + 140, 0, W / 2 - 20, 0);
        fadeL.addColorStop(0, "rgba(10,10,12,0)");
        fadeL.addColorStop(1, "rgba(10,10,12,1)");
        ctx.fillStyle = fadeL;
        ctx.fillRect(W / 2 - 20, topH + 12, 200, H - topH - 12 - 100);
        ctx.fillStyle = "#0A0A0C";
        ctx.fillRect(0, topH + 12, W / 2 + 40, H - topH - 12 - 100);

        // Supporter text on left of bottom panel
        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "700 16px 'Inter', sans-serif";
        ctx.letterSpacing = "5px";
        ctx.fillText("ENDORSED BY", 70, topH + 100);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 48px 'Inter', sans-serif";
        let bY = wrapText(ctx, (userName || "Your Name").toUpperCase(), 70, topH + 160, W / 2 - 80, 56, "left");

        if (userLocation) {
            ctx.fillStyle = accent;
            ctx.font = "600 20px 'Inter', sans-serif";
            ctx.fillText("📍 " + userLocation, 70, bY + 40);
        }
    }

    /* ════════════════════════════════════════════════════════════════
       6. PREMIUM ONYX — Vertical Diptych
       Two tall vertical panels side by side.
       Left: Candidate photo (full height) with name overlay at bottom.
       Right: Dark premium panel with supporter info.
       A gold vertical accent stripe separates them.
       ════════════════════════════════════════════════════════════════ */
    else {
        const midX = W / 2 + 20; // slightly off-center
        // Left panel: candidate photo
        drawCoverPhoto(chiefPhoto, 0, 0, midX, H - 100);
        // Bottom gradient on left panel
        const ov = ctx.createLinearGradient(0, H - 500, 0, H - 100);
        ov.addColorStop(0, "rgba(0,0,0,0)");
        ov.addColorStop(1, "rgba(0,0,0,0.9)");
        ctx.fillStyle = ov;
        ctx.fillRect(0, H - 500, midX, 400);

        // Candidate name on left panel (bottom)
        ctx.textAlign = "left";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 italic 42px 'Playfair Display', serif";
        ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 15;
        wrapText(ctx, "Rt. Hon. (Dr.) Abdullahi Ibrahim Ali", 40, H - 270, midX - 80, 50, "left");
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#C9A227";
        ctx.font = "800 18px 'Inter', sans-serif";
        ctx.letterSpacing = "3px";
        ctx.fillText("KOGI EAST SENATE • 2027", 40, H - 150);
        ctx.letterSpacing = "0px";

        // Gold vertical stripe
        ctx.fillStyle = "#C9A227";
        ctx.fillRect(midX, 0, 6, H - 100);

        // Right panel: dark premium
        const rGrad = ctx.createLinearGradient(midX, 0, midX, H);
        rGrad.addColorStop(0, "#0A0A0A");
        rGrad.addColorStop(1, "#111111");
        ctx.fillStyle = rGrad;
        ctx.fillRect(midX + 6, 0, W - midX - 6, H - 100);

        // Senate + APC logos
        const rx = midX + 6 + (W - midX - 6) / 2;
        drawLogo(ctx, senateLogo, rx, 60, 80);
        drawLogo(ctx, adcLogo, rx, 170, 65);

        // Supporter Photo (large, rounded rect)
        const photoW = W - midX - 106;
        const photoH = 420;
        drawRectPhoto(ctx, supporterPhoto, midX + 56, 300, photoW, photoH, 20, "#C9A227", "Your\nPhoto");

        // Supporter text
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "700 16px 'Inter', sans-serif";
        ctx.letterSpacing = "5px";
        ctx.fillText("PROUDLY ENDORSED BY", rx, 780);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#C9A227";
        ctx.font = "800 40px 'Playfair Display', serif";
        let vY = wrapText(ctx, (userName || "Your Name").toUpperCase(), rx, 830, photoW - 20, 48);

        if (userLocation) {
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.font = "500 18px 'Inter', sans-serif";
            ctx.fillText("📍 " + userLocation, rx, vY + 36);
        }

        // Decorative gold dots
        ctx.fillStyle = "rgba(201,162,39,0.3)";
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(rx - 60 + i * 30, vY + 80, 4, 0, Math.PI * 2);
            ctx.fill();
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
        img1.src = "/images/halims2.png";

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
