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
       Layout: Dramatic central portrait, glowing gold typography
       ═══════════════════════════════════════════════════════════ */
    if (id === "senate_crimson") {
        // Subtle top grid
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 250); ctx.stroke(); }
        for (let i = 0; i < 250; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

        // Logos
        drawLogo(ctx, senateLogo, W / 2 - 90, 40, 90);
        drawLogo(ctx, adcLogo, W / 2 + 90, 45, 80);

        // Header Text
        ctx.font = "800 36px 'Inter', sans-serif";
        ctx.fillStyle = accent;
        ctx.textAlign = "center";
        ctx.letterSpacing = "10px";
        ctx.fillText("NIGERIAN SENATE", W / 2, 190);
        ctx.font = "500 20px 'Inter', sans-serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.letterSpacing = "6px";
        ctx.fillText("KOGI EAST SENATORIAL DISTRICT", W / 2, 230);

        // Huge candidate portrait
        drawCirclePhoto(ctx, chiefPhoto, W / 2, 490, 220, accent, "Halims");
        // Inner/Outer borders
        ctx.strokeStyle = "rgba(201,162,39,0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(W / 2, 490, 235, 0, Math.PI * 2); ctx.stroke();

        // Beautiful candidate text
        ctx.font = "900 italic 62px 'Playfair Display', serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 15;
        wrapText(ctx, "Rt. Hon. (Dr.) Abdullahi Ibrahim Ali", W / 2, 790, W - 100, 70);
        ctx.shadowBlur = 0;

        ctx.font = "800 24px 'Inter', sans-serif";
        ctx.fillStyle = accent;
        ctx.letterSpacing = "3px";
        ctx.fillText("THE PEOPLE'S MANDATE • 2027", W / 2, 880);

        // Bottom supporter endorsement block
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(40, 940, W - 80, 260);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1;
        ctx.strokeRect(40, 940, W - 80, 260);

        drawRectPhoto(ctx, supporterPhoto, 70, 970, 160, 200, 8, accent, "Photo");

        ctx.font = "600 20px 'Inter', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.textAlign = "left";
        ctx.letterSpacing = "4px";
        ctx.fillText("PROUDLY ENDORSED BY", 260, 1020);

        ctx.font = "800 48px 'Playfair Display', serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText((userName || "Your Name").toUpperCase(), 260, 1070);

        if (userLocation) {
            ctx.font = "500 22px 'Inter', sans-serif";
            ctx.fillStyle = accent;
            ctx.fillText("📍 " + userLocation, 260, 1120);
        }
    }

    /* ═══════════════════════════════════════════════════════════
       2. NASS PRESTIGE: Sophisticated Champagne/Gold Editorial
       Layout: Offset styling, high-end magazine editorial feel
       ═══════════════════════════════════════════════════════════ */
    else if (id === "nass_prestige") {
        // Editorial Frame
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 30, W - 60, H - 160);
        ctx.lineWidth = 1;
        ctx.strokeRect(40, 40, W - 80, H - 180);

        // Top Left Headers
        ctx.textAlign = "left";
        ctx.fillStyle = accent;
        ctx.font = "800 64px 'Playfair Display', serif";
        ctx.fillText("H A L I M S", 80, 120);

        ctx.font = "600 18px 'Inter', sans-serif";
        ctx.letterSpacing = "5px";
        ctx.fillText("KOGI EAST SENATORIAL RACE 2027", 80, 160);

        // Logos (Top Right)
        drawLogo(ctx, senateLogo, W - 180, 60, 80);
        drawLogo(ctx, adcLogo, W - 90, 65, 70);

        // Large candidate block (Right-aligned)
        drawRectPhoto(ctx, chiefPhoto, W / 2 - 50, 220, 500, 600, 0, accent, "Halims");
        // Candidate Text Block overlaps photo
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(80, 600, 550, 180);
        ctx.strokeStyle = accent;
        ctx.strokeRect(70, 590, 550, 180);

        ctx.fillStyle = accent;
        ctx.textAlign = "center";
        ctx.font = "900 38px 'Playfair Display', serif";
        wrapText(ctx, "Rt. Hon. (Dr.) Abdullahi Ibrahim Ali", 355, 660, 500, 45);
        ctx.fillStyle = secondary;
        ctx.font = "700 18px 'Inter', sans-serif";
        ctx.letterSpacing = "3px";
        ctx.fillText("DEPUTY MAJORITY LEADER TO SENATE", 355, 740);

        // Endorsement Quote Area
        const quoteY = 880;
        ctx.textAlign = "left";
        ctx.font = "italic 700 80px 'Playfair Display', serif";
        ctx.fillStyle = "rgba(10,48,32,0.15)";
        ctx.fillText("\"", 80, quoteY);

        ctx.font = "600 24px 'Inter', sans-serif";
        ctx.fillStyle = accent;
        ctx.fillText("I stand with progressive leadership.", 120, quoteY - 20);
        ctx.font = "400 20px 'Inter', sans-serif";
        ctx.fillStyle = "#555";
        ctx.fillText("Kogi East deserves outstanding representation in the 11th Assembly.", 120, quoteY + 15);

        // Supporter Card
        drawCirclePhoto(ctx, supporterPhoto, 150, 1040, 70, accent, "Photo");
        ctx.font = "800 32px 'Playfair Display', serif";
        ctx.fillStyle = accent;
        ctx.fillText(userName || "Your Name", 240, 1030);
        ctx.font = "500 18px 'Inter', sans-serif";
        ctx.fillStyle = secondary;
        ctx.letterSpacing = "2px";
        ctx.fillText(`ENDORSED FOR 2027 ${userLocation ? '• ' + userLocation : ''}`, 240, 1060);
    }

    /* ═══════════════════════════════════════════════════════════
       3. PREMIUM ONYX: Ultra elite, dark mode, high contrast luxury
       Layout: Center-aligned, golden typography, cinematic
       ═══════════════════════════════════════════════════════════ */
    else if (id === "premium_halims") {
        // Top luxury header
        ctx.fillStyle = "#111111";
        ctx.fillRect(0, 0, W, 120);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, 120); ctx.lineTo(W, 120); ctx.stroke();

        ctx.textAlign = "center";
        ctx.font = "500 18px 'Inter', sans-serif";
        ctx.fillStyle = accent;
        ctx.letterSpacing = "8px";
        ctx.fillText("THE SENATORIAL AMBITION", W / 2, 45);
        ctx.font = "800 32px 'Playfair Display', serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.letterSpacing = "4px";
        ctx.fillText("K O G I   E A S T   2 0 2 7", W / 2, 90);

        // Center split portraits
        const pSize = 360;
        const cy = 400;
        // Chief Photo
        drawRectPhoto(ctx, chiefPhoto, W / 2 - pSize + 10, cy - pSize / 2, pSize - 20, pSize * 1.2, 12, "#333333", "Halims");
        // Supporter Photo
        drawRectPhoto(ctx, supporterPhoto, W / 2 + 10, cy - pSize / 2, pSize - 20, pSize * 1.2, 12, accent, "Supporter");

        // "VOTE" badge crossing the middle of the photos
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(W / 2, cy + pSize / 2 + 20, 50, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.font = "900 24px 'Inter', sans-serif";
        ctx.fillText("APC", W / 2, cy + pSize / 2 + 28);

        // Huge Text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 italic 55px 'Playfair Display', serif";
        wrapText(ctx, "Rt. Hon. (Dr.) Abdullahi Ibrahim Ali", W / 2, 720, W - 100, 60);

        ctx.fillStyle = accent;
        ctx.fillRect(W / 2 - 60, 810, 120, 2);

        // Supporter Text
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "600 20px 'Inter', sans-serif";
        ctx.letterSpacing = "6px";
        ctx.fillText("PROUDLY ENDORSED BY", W / 2, 880);

        ctx.fillStyle = accent;
        ctx.font = "800 50px 'Playfair Display', serif";
        wrapText(ctx, userName || "Your Name", W / 2, 940, W - 100, 55);

        if (userLocation) {
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.font = "400 22px 'Inter', sans-serif";
            ctx.fillText(userLocation.toUpperCase(), W / 2, 1020);
        }

        // Logos floating bottom corners
        drawLogo(ctx, senateLogo, 100, 1050, 90);
        drawLogo(ctx, adcLogo, W - 100, 1050, 80);
    }

    /* ═══════════════════════════════════════════════════════════
       4. MODERN APC: Tech-forward, vibrant, bold blue/red angles
       Layout: Angular clipping, huge typography, modern UI aesthetic
       ═══════════════════════════════════════════════════════════ */
    else if (id === "modern_apc") {
        // Dramatic diagonal angle background
        ctx.fillStyle = "#0A0A0A";
        ctx.beginPath();
        ctx.moveTo(0, 600);
        ctx.lineTo(W, 400);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.fill();

        // Blue accent slash
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(0, 600);
        ctx.lineTo(W, 400);
        ctx.lineTo(W, 430);
        ctx.lineTo(0, 630);
        ctx.fill();

        // Top Logos
        drawLogo(ctx, senateLogo, 120, 80, 80);
        ctx.textAlign = "left";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 42px 'Inter', sans-serif";
        ctx.letterSpacing = "4px";
        ctx.fillText("SENATE 2027", 220, 110);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "600 20px 'Inter', sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText("KOGI EAST SENATORIAL DISTRICT", 220, 140);

        drawLogo(ctx, adcLogo, W - 100, 80, 80);

        // Candidate Photo embedded in the dark top section
        drawCirclePhoto(ctx, chiefPhoto, 260, 360, 180, accent, "Halims");

        ctx.textAlign = "right";
        ctx.font = "900 52px 'Inter', sans-serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("RT. HON. (DR.)", W - 60, 320);
        ctx.fillStyle = accent;
        ctx.fillText("ABDULLAHI", W - 60, 380);
        ctx.fillText("IBRAHIM ALI", W - 60, 440);

        // Supporter Photo embedded in the bottom dark section
        drawCirclePhoto(ctx, supporterPhoto, W - 220, 800, 150, "#FFFFFF", "Photo");

        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "800 24px 'Inter', sans-serif";
        ctx.letterSpacing = "6px";
        ctx.fillText("100% SUPPORTER", 60, 780);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 56px 'Inter', sans-serif";
        wrapText(ctx, (userName || "Your Name").toUpperCase(), 60, 850, W - 400, 60, "left");

        if (userLocation) {
            ctx.fillStyle = secondary;
            ctx.font = "600 22px 'Inter', sans-serif";
            ctx.fillText(userLocation.toUpperCase(), 60, 960);
        }
    }

    /* ═══════════════════════════════════════════════════════════
       5. GOLDEN MANDATE: Bright, approachable, community focused
       Layout: Clean typography, overlapping frames, warm tones
       ═══════════════════════════════════════════════════════════ */
    else if (id === "golden_mandate") {
        // Red Top Header
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(W, 0);
        ctx.lineTo(W, 300);
        ctx.arcTo(W / 2, 400, 0, 300, 1000);
        ctx.lineTo(0, 300);
        ctx.fill();

        ctx.textAlign = "center";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 32px 'Inter', sans-serif";
        ctx.letterSpacing = "6px";
        ctx.fillText("ALL PROGRESSIVES CONGRESS", W / 2, 60);

        // Photos overlapping header curve
        drawRectPhoto(ctx, chiefPhoto, 100, 180, 400, 500, 24, "#FFFFFF", "Halims");
        drawRectPhoto(ctx, supporterPhoto, W - 460, 280, 360, 450, 24, "#C9A227", "Photo");

        // Shadows via duplication
        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 15;
        // Text Box
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, 60, 780, W - 120, 280, 24);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Big logos next to text box
        drawLogo(ctx, senateLogo, 160, 920, 140);

        ctx.textAlign = "left";
        ctx.fillStyle = "#1A1A1A";
        ctx.font = "900 46px 'Inter', sans-serif";
        ctx.fillText("Rt. Hon. (Dr.) Abdullahi Ibrahim Ali", 300, 850);
        ctx.fillStyle = accent;
        ctx.font = "700 24px 'Inter', sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText("FOR KOGI EAST SENATORIAL DISTRICT 2027", 300, 890);

        ctx.fillStyle = "#666666";
        ctx.font = "600 20px 'Inter', sans-serif";
        ctx.fillText("I, " + (userName || "Your Name") + " stand firmly with HALIMS for Senate.", 300, 950);
        if (userLocation) {
            ctx.fillStyle = secondary;
            ctx.fillText("📍 " + userLocation, 300, 1000);
        }

        drawLogo(ctx, adcLogo, W - 160, 920, 110);
    }

    /* ═══════════════════════════════════════════════════════════
       6. GLASS CHAMBER: Frosted glass UI, profound depths, ultra modern
       Layout: Center symmetry, glassmorphism cards over dark forest green
       ═══════════════════════════════════════════════════════════ */
    else {
        // Top Banner
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, W, 10);

        // Huge Senate Logo watermark behind glass
        drawBgImage(senateLogo, 0.15, "screen");

        // Glassmorphism Card
        ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1;
        roundRect(ctx, 50, 60, W - 100, H - 280, 32);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = accent;
        ctx.font = "800 28px 'Inter', sans-serif";
        ctx.letterSpacing = "12px";
        ctx.fillText("OFFICIAL ENDORSEMENT", W / 2, 140);

        drawLogo(ctx, senateLogo, W / 2, 220, 90);

        // Huge Text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 italic 56px 'Playfair Display', serif";
        wrapText(ctx, "Rt. Hon. (Dr.) Abdullahi Ibrahim Ali", W / 2, 350, W - 200, 65);

        // Gradient divider
        const divG = ctx.createLinearGradient(150, 0, W - 150, 0);
        divG.addColorStop(0, "rgba(201,162,39,0)");
        divG.addColorStop(0.5, "#C9A227");
        divG.addColorStop(1, "rgba(201,162,39,0)");
        ctx.fillStyle = divG;
        ctx.fillRect(150, 480, W - 300, 2);

        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "600 22px 'Inter', sans-serif";
        ctx.letterSpacing = "6px";
        ctx.fillText("PROUDLY ENDORSED BY", W / 2, 570);

        // Glass photo rings
        drawCirclePhoto(ctx, supporterPhoto, W / 2, 740, 120, accent, "Photo");
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.beginPath(); ctx.arc(W / 2, 740, 140, 0, Math.PI * 2); ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 48px 'Playfair Display', serif";
        wrapText(ctx, userName || "Your Name", W / 2, 950, W - 200, 55);

        if (userLocation) {
            ctx.fillStyle = accent;
            ctx.font = "500 22px 'Inter', sans-serif";
            ctx.fillText("📍 " + userLocation.toUpperCase(), W / 2, 1020);
        }

        drawLogo(ctx, adcLogo, W / 2, 1140, 70);
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
