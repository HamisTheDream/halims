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

    const { bg, accent, secondary, textPrimary, textSecondary, id } = template;
    const senateLogo = igalaBg; // Repurposed for Senate Logo

    /* ── BASE BACKGROUNDS ── */
    if (id === "senate_crimson") {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "#C4000C");
        grad.addColorStop(1, "#4A0000");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    } else if (id === "premium_halims") {
        const rGrad = ctx.createRadialGradient(W / 2, 300, 100, W / 2, 400, 800);
        rGrad.addColorStop(0, "#1A1A1A");
        rGrad.addColorStop(1, "#000000");
        ctx.fillStyle = rGrad;
        ctx.fillRect(0, 0, W, H);
    } else if (id === "glass_chamber" || id === "modern_apc") {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, bg);
        grad.addColorStop(1, "#05150E"); // very dark green/blue base
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    } else {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
    }

    // Background Image Helper
    const drawBgImage = (img: HTMLImageElement | null, opacity: number, blendMode: GlobalCompositeOperation = "source-over") => {
        if (!img) return;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.globalCompositeOperation = blendMode;
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

    /* ── BACKGROUND OVERLAYS ── */
    if (id === "senate_crimson") {
        drawBgImage(nassBg, 0.25, "multiply");
        drawBgImage(nigeriaBg, 0.05, "overlay");
    } else if (id === "nass_prestige") {
        drawBgImage(nigeriaBg, 0.5, "screen"); // Soft light overlay for prestige
        drawBgImage(nassBg, 0.1, "multiply");
    } else if (id === "premium_halims") {
        drawBgImage(nassBg, 0.15, "screen");
        drawBgImage(nigeriaBg, 0.08, "screen");
    } else if (id === "golden_mandate") {
        drawBgImage(nassBg, 0.1);
        ctx.fillStyle = "rgba(255,249,230,0.8)";
        ctx.fillRect(0, 0, W, H);
    } else {
        drawBgImage(nassBg, 0.1, "overlay");
    }

    /* ═══════════════════════════════════════════════════════════
       1. SENATE CRIMSON: The Red Chamber Majesty
       ═══════════════════════════════════════════════════════════ */
    if (id === "senate_crimson") {
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 200); ctx.stroke(); }
        for (let i = 0; i < 200; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

        drawLogo(ctx, senateLogo, W / 2 - 100, 40, 80);
        drawLogo(ctx, adcLogo, W / 2 + 100, 48, 70);

        ctx.font = "800 32px 'Inter', sans-serif";
        ctx.fillStyle = accent;
        ctx.textAlign = "center";
        ctx.letterSpacing = "10px";
        ctx.fillText("NIGERIAN SENATE", W / 2, 170);
        ctx.font = "500 18px 'Inter', sans-serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.letterSpacing = "6px";
        ctx.fillText("KOGI EAST SENATORIAL DISTRICT", W / 2, 205);

        // Candidate Portrait
        drawCirclePhoto(ctx, chiefPhoto, W / 2, 450, 200, accent, "Halims");
        ctx.strokeStyle = "rgba(201,162,39,0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(W / 2, 450, 215, 0, Math.PI * 2); ctx.stroke();

        ctx.font = "900 italic 52px 'Playfair Display', serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 10;
        let cY = wrapText(ctx, "Rt. Hon. (Dr.) Abdullahi Ibrahim Ali", W / 2, 730, W - 160, 60);
        ctx.shadowBlur = 0;

        ctx.font = "800 20px 'Inter', sans-serif";
        ctx.fillStyle = accent;
        ctx.letterSpacing = "3px";
        ctx.fillText("THE PEOPLE'S MANDATE • 2027", W / 2, cY + 40);

        // Supporter Block (Starts below candidate text dynamically)
        const blockY = cY + 90;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        roundRect(ctx, 50, blockY, W - 100, 260, 24);
        ctx.fill();
        ctx.strokeStyle = "rgba(201,162,39,0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();

        drawCirclePhoto(ctx, supporterPhoto, 180, blockY + 130, 90, accent, "Photo");

        ctx.font = "600 18px 'Inter', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.textAlign = "left";
        ctx.letterSpacing = "4px";
        ctx.fillText("PROUDLY ENDORSED BY", 310, blockY + 90);

        ctx.font = "800 42px 'Playfair Display', serif";
        ctx.fillStyle = "#FFFFFF";
        let uY = wrapText(ctx, (userName || "Your Name").toUpperCase(), 310, blockY + 140, W - 400, 50);

        if (userLocation) {
            ctx.font = "500 20px 'Inter', sans-serif";
            ctx.fillStyle = accent;
            ctx.fillText("📍 " + userLocation, 310, uY + 30);
        }
    }

    /* ═══════════════════════════════════════════════════════════
       2. NASS PRESTIGE: Sophisticated Champagne/Gold Editorial
       ═══════════════════════════════════════════════════════════ */
    else if (id === "nass_prestige") {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 30, W - 60, H - 160);
        ctx.lineWidth = 1;
        ctx.strokeRect(40, 40, W - 80, H - 180);

        ctx.textAlign = "left";
        ctx.fillStyle = accent;
        ctx.font = "800 58px 'Playfair Display', serif";
        ctx.fillText("H A L I M S", 80, 110);

        ctx.font = "600 16px 'Inter', sans-serif";
        ctx.letterSpacing = "4px";
        ctx.fillText("KOGI EAST SENATORIAL RACE 2027", 80, 145);

        drawLogo(ctx, senateLogo, W - 160, 60, 70);
        drawLogo(ctx, adcLogo, W - 80, 65, 60);

        drawRectPhoto(ctx, chiefPhoto, W / 2, 200, 460, 550, 0, accent, "Halims");

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(80, 600, 500, 160);
        ctx.strokeStyle = accent;
        ctx.strokeRect(70, 590, 500, 160);

        ctx.fillStyle = accent;
        ctx.textAlign = "center";
        ctx.font = "900 34px 'Playfair Display', serif";
        wrapText(ctx, "Rt. Hon. (Dr.) Abdullahi Ibrahim Ali", 320, 660, 440, 42);
        ctx.fillStyle = secondary;
        ctx.font = "700 16px 'Inter', sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText("DEPUTY MAJORITY LEADER TO SENATE", 320, 725);

        ctx.textAlign = "left";
        ctx.font = "italic 700 80px 'Playfair Display', serif";
        ctx.fillStyle = "rgba(10,48,32,0.15)";
        ctx.fillText("\"", 80, 860);

        ctx.font = "600 22px 'Inter', sans-serif";
        ctx.fillStyle = accent;
        ctx.fillText("I stand with progressive leadership.", 120, 840);
        ctx.font = "400 18px 'Inter', sans-serif";
        ctx.fillStyle = "#555";
        ctx.fillText("Kogi East deserves outstanding representation in the 11th Assembly.", 120, 875);

        drawCirclePhoto(ctx, supporterPhoto, 150, 1020, 75, accent, "Photo");
        ctx.font = "800 30px 'Playfair Display', serif";
        ctx.fillStyle = accent;
        ctx.fillText((userName || "Your Name").toUpperCase(), 250, 1010);
        ctx.font = "500 16px 'Inter', sans-serif";
        ctx.fillStyle = secondary;
        ctx.letterSpacing = "2px";
        ctx.fillText(`ENDORSED FOR 2027 ${userLocation ? '• ' + userLocation : ''}`, 250, 1045);
    }

    /* ═══════════════════════════════════════════════════════════
       3. PREMIUM ONYX: Ultra elite, dark mode, high contrast luxury
       ═══════════════════════════════════════════════════════════ */
    else if (id === "premium_halims") {
        ctx.fillStyle = "#111111";
        ctx.fillRect(0, 0, W, 120);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, 120); ctx.lineTo(W, 120); ctx.stroke();

        ctx.textAlign = "center";
        ctx.font = "500 16px 'Inter', sans-serif";
        ctx.fillStyle = accent;
        ctx.letterSpacing = "6px";
        ctx.fillText("THE SENATORIAL AMBITION", W / 2, 45);
        ctx.font = "800 30px 'Playfair Display', serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.letterSpacing = "4px";
        ctx.fillText("K O G I   E A S T   2 0 2 7", W / 2, 90);

        const pSize = 340;
        const cy = 350;
        drawRectPhoto(ctx, chiefPhoto, W / 2 - pSize + 10, cy - pSize / 2, pSize - 20, pSize * 1.2, 16, "#333333", "Halims");
        drawRectPhoto(ctx, supporterPhoto, W / 2 + 10, cy - pSize / 2, pSize - 20, pSize * 1.2, 16, accent, "Supporter");

        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(W / 2, cy + pSize / 2 + 30, 45, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.font = "900 20px 'Inter', sans-serif";
        ctx.fillText("APC", W / 2, cy + pSize / 2 + 38);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 italic 48px 'Playfair Display', serif";
        let txtY = wrapText(ctx, "Rt. Hon. (Dr.) Abdullahi Ibrahim Ali", W / 2, 680, W - 140, 56);

        ctx.fillStyle = accent;
        ctx.fillRect(W / 2 - 60, txtY + 30, 120, 2);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "600 18px 'Inter', sans-serif";
        ctx.letterSpacing = "6px";
        ctx.fillText("PROUDLY ENDORSED BY", W / 2, txtY + 90);

        ctx.fillStyle = accent;
        ctx.font = "800 46px 'Playfair Display', serif";
        let finY = wrapText(ctx, (userName || "Your Name").toUpperCase(), W / 2, txtY + 150, W - 140, 52);

        if (userLocation) {
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.font = "400 20px 'Inter', sans-serif";
            ctx.fillText(userLocation.toUpperCase(), W / 2, finY + 40);
        }

        drawLogo(ctx, senateLogo, 100, 1080, 80);
        drawLogo(ctx, adcLogo, W - 100, 1080, 70);
    }

    /* ═══════════════════════════════════════════════════════════
       4. MODERN APC: Tech-forward, vibrant, bold blue/red angles
       ═══════════════════════════════════════════════════════════ */
    else if (id === "modern_apc") {
        ctx.fillStyle = "#0A0A0A";
        ctx.beginPath(); ctx.moveTo(0, 550); ctx.lineTo(W, 350); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();

        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.moveTo(0, 550); ctx.lineTo(W, 350); ctx.lineTo(W, 380); ctx.lineTo(0, 580); ctx.fill();

        drawLogo(ctx, senateLogo, 100, 70, 70);
        ctx.textAlign = "left";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 38px 'Inter', sans-serif";
        ctx.letterSpacing = "4px";
        ctx.fillText("SENATE 2027", 180, 95);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "600 18px 'Inter', sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText("KOGI EAST SENATORIAL DISTRICT", 180, 125);

        drawLogo(ctx, adcLogo, W - 80, 75, 70);

        drawCirclePhoto(ctx, chiefPhoto, 240, 320, 160, accent, "Halims");

        ctx.textAlign = "right";
        ctx.font = "900 46px 'Inter', sans-serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("RT. HON. (DR.)", W - 60, 270);
        ctx.fillStyle = accent;
        ctx.fillText("ABDULLAHI", W - 60, 325);
        ctx.fillText("IBRAHIM ALI", W - 60, 380);

        drawCirclePhoto(ctx, supporterPhoto, W - 200, 840, 140, "#FFFFFF", "Photo");

        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "800 20px 'Inter', sans-serif";
        ctx.letterSpacing = "6px";
        ctx.fillText("100% SUPPORTER", 60, 740);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 50px 'Inter', sans-serif";
        // Manual wrapping logic for left alignment
        const words = (userName || "Your Name").toUpperCase().split(" ");
        let line = "";
        let lineY = 800;
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + " ";
            if (ctx.measureText(testLine).width > (W - 380) && i > 0) {
                ctx.fillText(line, 60, lineY);
                line = words[i] + " ";
                lineY += 55;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 60, lineY);

        if (userLocation) {
            ctx.fillStyle = secondary;
            ctx.font = "600 20px 'Inter', sans-serif";
            ctx.fillText(userLocation.toUpperCase(), 60, lineY + 60);
        }
    }

    /* ═══════════════════════════════════════════════════════════
       5. GOLDEN MANDATE: Bright, approachable, community focused
       ═══════════════════════════════════════════════════════════ */
    else if (id === "golden_mandate") {
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 280);
        ctx.arcTo(W / 2, 380, 0, 280, 1000); ctx.lineTo(0, 280); ctx.fill();

        ctx.textAlign = "center";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 30px 'Inter', sans-serif";
        ctx.letterSpacing = "6px";
        ctx.fillText("ALL PROGRESSIVES CONGRESS", W / 2, 60);

        drawRectPhoto(ctx, chiefPhoto, 120, 150, 380, 480, 24, "#FFFFFF", "Halims");
        drawRectPhoto(ctx, supporterPhoto, W - 440, 250, 320, 420, 24, "#C9A227", "Photo");

        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 15;
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, 60, 750, W - 120, 280, 24);
        ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

        drawLogo(ctx, senateLogo, 160, 890, 120);

        ctx.textAlign = "left";
        ctx.fillStyle = "#1A1A1A";
        ctx.font = "900 40px 'Inter', sans-serif";
        ctx.fillText("Rt. Hon. (Dr.) Abdullahi Ibrahim Ali", 280, 820);
        ctx.fillStyle = accent;
        ctx.font = "700 20px 'Inter', sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText("FOR KOGI EAST SENATORIAL DISTRICT 2027", 280, 860);

        ctx.fillStyle = "#666666";
        ctx.font = "600 18px 'Inter', sans-serif";
        // Manual wrap for left alignment
        let textLine = "I, " + (userName || "Your Name") + " stand firmly with HALIMS for Senate.";
        const metrics = ctx.measureText(textLine);
        if (metrics.width > (W - 340)) {
            // Very long text
            ctx.fillText("I, " + (userName || "Your Name"), 280, 920);
            ctx.fillText("stand firmly with HALIMS for Senate.", 280, 950);
            if (userLocation) ctx.fillText("📍 " + userLocation, 280, 990);
        } else {
            ctx.fillText(textLine, 280, 920);
            if (userLocation) ctx.fillText("📍 " + userLocation, 280, 960);
        }

        drawLogo(ctx, adcLogo, W - 140, 890, 90);
    }

    /* ═══════════════════════════════════════════════════════════
       6. GLASS CHAMBER: Frosted glass UI, profound depths, ultra modern
       ═══════════════════════════════════════════════════════════ */
    else {
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, W, 10);

        ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1;
        roundRect(ctx, 50, 60, W - 100, H - 280, 32);
        ctx.fill(); ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = accent;
        ctx.font = "800 24px 'Inter', sans-serif";
        ctx.letterSpacing = "10px";
        ctx.fillText("OFFICIAL ENDORSEMENT", W / 2, 130);

        drawLogo(ctx, senateLogo, W / 2, 210, 80);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 italic 48px 'Playfair Display', serif";
        wrapText(ctx, "Rt. Hon. (Dr.) Abdullahi Ibrahim Ali", W / 2, 330, W - 260, 56);

        const divG = ctx.createLinearGradient(150, 0, W - 150, 0);
        divG.addColorStop(0, "rgba(201,162,39,0)");
        divG.addColorStop(0.5, "#C9A227");
        divG.addColorStop(1, "rgba(201,162,39,0)");
        ctx.fillStyle = divG;
        ctx.fillRect(150, 460, W - 300, 2);

        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "600 20px 'Inter', sans-serif";
        ctx.letterSpacing = "6px";
        ctx.fillText("PROUDLY ENDORSED BY", W / 2, 530);

        drawCirclePhoto(ctx, supporterPhoto, W / 2, 690, 110, accent, "Photo");
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.beginPath(); ctx.arc(W / 2, 690, 130, 0, Math.PI * 2); ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 42px 'Playfair Display', serif";
        let glasY = wrapText(ctx, (userName || "Your Name").toUpperCase(), W / 2, 880, W - 220, 52);

        if (userLocation) {
            ctx.fillStyle = accent;
            ctx.font = "500 20px 'Inter', sans-serif";
            ctx.fillText("📍 " + userLocation.toUpperCase(), W / 2, glasY + 40);
        }

        drawLogo(ctx, adcLogo, W / 2, 1080, 65);
    }

    /* ── BOTTOM BANNER (all templates) ── */
    const bannerH = 120;
    const bannerBg = (id === "nass_prestige" || id === "golden_mandate") ? "#8B0000" : "#000000";
    ctx.fillStyle = bannerBg;
    ctx.fillRect(0, H - bannerH, W, bannerH);
    ctx.strokeStyle = id === "nass_prestige" || id === "golden_mandate" ? "#C9A227" : "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H - bannerH); ctx.lineTo(W, H - bannerH); ctx.stroke();

    ctx.font = "900 30px 'Inter', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.letterSpacing = "4px";
    ctx.fillText("VOTE APC • KOGI EAST SENATORIAL DISTRICT • 2027", W / 2, H - 72);
    ctx.letterSpacing = "0px";

    ctx.font = "500 16px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("Powered by HamisNetwork 4 Halims", W / 2, H - 36);
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
