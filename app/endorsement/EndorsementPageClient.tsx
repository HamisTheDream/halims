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
    { id: "senate_crimson", name: "Vertical Thirds", preview: "linear-gradient(90deg, #004d2e 33%, #8b0000 66%, #8b0000)", bg: "#004d2e", accent: "#C9A227", secondary: "#FFFFFF", textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.85)" },
    { id: "nass_prestige", name: "The Seal", preview: "linear-gradient(135deg, #FAFAFA, #004d2e)", bg: "#FAFAFA", accent: "#004d2e", secondary: "#8b0000", textPrimary: "#1A1A1A", textSecondary: "#333333" },
    { id: "golden_mandate", name: "Chevron Banner", preview: "linear-gradient(135deg, #004d2e, #111111, #8b0000)", bg: "#111111", accent: "#C9A227", secondary: "#004d2e", textPrimary: "#FFFFFF", textSecondary: "#C9A227" },
    { id: "glass_chamber", name: "Newspaper", preview: "linear-gradient(135deg, #FDF5E6, #1A1A1A)", bg: "#FDF5E6", accent: "#004d2e", secondary: "#8b0000", textPrimary: "#1A1A1A", textSecondary: "#333333" },
    { id: "modern_apc", name: "Spotlight", preview: "linear-gradient(135deg, #000000, #333333)", bg: "#000000", accent: "#C9A227", secondary: "#004d2e", textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.6)" },
    { id: "premium_halims", name: "The Declaration", preview: "linear-gradient(135deg, #F8F0E0, #004d2e)", bg: "#F8F0E0", accent: "#004d2e", secondary: "#8b0000", textPrimary: "#1A1A1A", textSecondary: "#C9A227" },
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

    /* ================================================================
       TEMPLATE 1 — "VERTICAL THIRDS" (senate_crimson)
       Three vertical columns: left = solid green, center = candidate
       photo full-height, right = solid red. Name spans bottom.
       ================================================================ */
    if (id === "senate_crimson") {
        const colW = W / 3;

        // Left column: deep green
        ctx.fillStyle = "#004d2e";
        ctx.fillRect(0, 0, colW, H);

        // Center column: candidate photo
        drawCoverPhoto(chiefPhoto, colW, 0, colW, H);

        // Right column: senate red
        ctx.fillStyle = "#8b0000";
        ctx.fillRect(colW * 2, 0, colW, H);

        // Bottom overlay across all three
        const botGrad = ctx.createLinearGradient(0, H - 500, 0, H);
        botGrad.addColorStop(0, "rgba(0,0,0,0)");
        botGrad.addColorStop(0.5, "rgba(0,0,0,0.85)");
        botGrad.addColorStop(1, "rgba(0,0,0,1)");
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, H - 500, W, 500);

        // Logos centered at top
        drawLogo(ctx, senateLogo, W / 2 - 60, 40, 70);
        drawLogo(ctx, adcLogo, W / 2 + 60, 45, 65);

        // Gold horizontal line
        ctx.fillStyle = "#C9A227";
        ctx.fillRect(80, H - 350, W - 160, 3);

        // Candidate Name
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 italic 78px 'Playfair Display', serif";
        wrapText(ctx, "Halims for Senate", W / 2, H - 280, W - 120, 84);

        ctx.fillStyle = "#C9A227";
        ctx.font = "700 22px 'Inter', sans-serif";
        ctx.letterSpacing = "6px";
        ctx.fillText("KOGI EAST • 2027", W / 2, H - 180);
        ctx.letterSpacing = "0px";

        // Supporter photo + name at left column center
        drawCirclePhoto(ctx, supporterPhoto, colW / 2, 500, 100, "#C9A227", "Your\nPhoto");

        ctx.textAlign = "center";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 14px 'Inter', sans-serif";
        ctx.letterSpacing = "3px";
        ctx.fillText("ENDORSED BY", colW / 2, 640);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#C9A227";
        ctx.font = "800 24px 'Inter', sans-serif";
        wrapText(ctx, (userName || "Your Name").toUpperCase(), colW / 2, 680, colW - 40, 28);

        if (userLocation) {
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.font = "500 16px 'Inter', sans-serif";
            ctx.fillText(userLocation, colW / 2, 740);
        }
    }

    /* ================================================================
       TEMPLATE 2 — "THE SEAL" (nass_prestige)
       Full white background. A massive circular emblem at center
       containing the candidate photo. Green and red arcs frame it.
       ================================================================ */
    else if (id === "nass_prestige") {
        ctx.fillStyle = "#FAFAFA";
        ctx.fillRect(0, 0, W, H);

        const cx = W / 2, cy = 480, outerR = 320;

        // Outer green arc (left half)
        ctx.strokeStyle = "#004d2e";
        ctx.lineWidth = 30;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, Math.PI * 0.65, Math.PI * 1.35);
        ctx.stroke();

        // Outer red arc (right half)
        ctx.strokeStyle = "#8b0000";
        ctx.lineWidth = 30;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, Math.PI * 1.65, Math.PI * 0.35);
        ctx.stroke();

        // Gold thin ring
        ctx.strokeStyle = "#C9A227";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR - 20, 0, Math.PI * 2);
        ctx.stroke();

        // Candidate photo clipped to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, outerR - 25, 0, Math.PI * 2);
        ctx.clip();
        drawCoverPhoto(chiefPhoto, cx - outerR, cy - outerR, outerR * 2, outerR * 2);
        ctx.restore();

        // Logos flanking the seal
        drawLogo(ctx, senateLogo, 160, 60, 80);
        drawLogo(ctx, adcLogo, W - 160, 65, 75);

        // "HALIMS FOR SENATE" curved text effect (simplified as straight)
        ctx.textAlign = "center";
        ctx.fillStyle = "#004d2e";
        ctx.font = "900 52px 'Playfair Display', serif";
        ctx.fillText("HALIMS", cx, cy + outerR + 80);

        ctx.fillStyle = "#8b0000";
        ctx.font = "700 22px 'Inter', sans-serif";
        ctx.letterSpacing = "8px";
        ctx.fillText("FOR SENATE 2027", cx, cy + outerR + 120);
        ctx.letterSpacing = "0px";

        // Supporter section: clean card below
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = "rgba(0,0,0,0.08)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 5;
        roundRect(ctx, 100, 920, W - 200, 280, 20);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Green top accent on card
        ctx.fillStyle = "#004d2e";
        roundRect(ctx, 100, 920, W - 200, 6, 20);
        ctx.fill();

        drawCirclePhoto(ctx, supporterPhoto, 250, 1060, 80, "#8b0000", "Photo");

        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.font = "600 14px 'Inter', sans-serif";
        ctx.letterSpacing = "4px";
        ctx.fillText("PROUDLY ENDORSED BY", 360, 1010);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#1A1A1A";
        ctx.font = "800 36px 'Inter', sans-serif";
        wrapText(ctx, (userName || "Your Name").toUpperCase(), 360, 1060, W - 500, 42, "left");

        if (userLocation) {
            ctx.fillStyle = "#8b0000";
            ctx.font = "500 18px 'Inter', sans-serif";
            ctx.fillText("📍 " + userLocation, 360, 1130);
        }
    }

    /* ================================================================
       TEMPLATE 3 — "CHEVRON BANNER" (golden_mandate)
       Dark background. Two large opposing chevron/arrow shapes
       in green and red creating a V pointing right. Candidate fills
       the V gap. Bold geometric type.
       ================================================================ */
    else if (id === "golden_mandate") {
        ctx.fillStyle = "#111111";
        ctx.fillRect(0, 0, W, H);

        // Top chevron (green) pointing right
        ctx.fillStyle = "#004d2e";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(W * 0.65, 0);
        ctx.lineTo(W * 0.35, H / 2);
        ctx.lineTo(0, H / 2);
        ctx.fill();

        // Bottom chevron (red) pointing right
        ctx.fillStyle = "#8b0000";
        ctx.beginPath();
        ctx.moveTo(0, H / 2);
        ctx.lineTo(W * 0.35, H / 2);
        ctx.lineTo(W * 0.65, H);
        ctx.lineTo(0, H);
        ctx.fill();

        // Candidate photo on the right side
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(W * 0.35, 0);
        ctx.lineTo(W, 0);
        ctx.lineTo(W, H);
        ctx.lineTo(W * 0.35, H);
        ctx.clip();
        drawCoverPhoto(chiefPhoto, W * 0.25, 0, W * 0.75, H);
        // Fade left edge
        const fadeL = ctx.createLinearGradient(W * 0.25, 0, W * 0.5, 0);
        fadeL.addColorStop(0, "rgba(17,17,17,1)");
        fadeL.addColorStop(1, "rgba(17,17,17,0)");
        ctx.fillStyle = fadeL;
        ctx.fillRect(W * 0.25, 0, W * 0.3, H);
        ctx.restore();

        // Logos
        drawLogo(ctx, senateLogo, 120, 60, 70);
        drawLogo(ctx, adcLogo, 120, 160, 60);

        // Candidate name on left
        ctx.textAlign = "left";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 68px 'Playfair Display', serif";
        ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 10;
        wrapText(ctx, "Rt. Hon. Halims", 70, 380, W * 0.5, 76, "left");
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#C9A227";
        ctx.font = "700 20px 'Inter', sans-serif";
        ctx.letterSpacing = "6px";
        ctx.fillText("FOR SENATE 2027", 75, 550);
        ctx.letterSpacing = "0px";

        // Supporter in bottom-left zone
        drawCirclePhoto(ctx, supporterPhoto, 180, 850, 90, "#C9A227", "Photo");

        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "600 14px 'Inter', sans-serif";
        ctx.letterSpacing = "4px";
        ctx.fillText("ENDORSED BY", 300, 810);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 38px 'Inter', sans-serif";
        let cY = wrapText(ctx, (userName || "Your Name").toUpperCase(), 300, 860, W * 0.4, 44, "left");

        if (userLocation) {
            ctx.fillStyle = "#C9A227";
            ctx.font = "500 18px 'Inter', sans-serif";
            ctx.fillText("📍 " + userLocation, 300, cY + 40);
        }
    }

    /* ================================================================
       TEMPLATE 4 — "NEWSPAPER FRONT PAGE" (glass_chamber)
       Styled like a broadsheet newspaper with masthead, columns,
       and a large hero photograph. Serif-heavy typography.
       ================================================================ */
    else if (id === "glass_chamber") {
        ctx.fillStyle = "#FDF5E6"; // Old paper
        ctx.fillRect(0, 0, W, H);

        // Double rule at top
        ctx.fillStyle = "#1A1A1A";
        ctx.fillRect(60, 40, W - 120, 4);
        ctx.fillRect(60, 48, W - 120, 1);

        // Masthead
        ctx.textAlign = "center";
        ctx.fillStyle = "#1A1A1A";
        ctx.font = "900 22px 'Inter', sans-serif";
        ctx.letterSpacing = "12px";
        ctx.fillText("THE KOGI EAST HERALD", W / 2, 90);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#8b0000";
        ctx.font = "italic 16px 'Playfair Display', serif";
        ctx.fillText("Special Endorsement Edition  •  Kogi State, Nigeria  •  2027", W / 2, 115);

        // Rule below masthead
        ctx.fillStyle = "#1A1A1A";
        ctx.fillRect(60, 130, W - 120, 2);

        // Logos beside masthead
        drawLogo(ctx, senateLogo, 130, 60, 55);
        drawLogo(ctx, adcLogo, W - 130, 65, 50);

        // Headline
        ctx.fillStyle = "#1A1A1A";
        ctx.font = "900 italic 62px 'Playfair Display', serif";
        wrapText(ctx, "Halims Declares for Senate", W / 2, 200, W - 150, 70);

        // Sub-headline
        ctx.fillStyle = "#8b0000";
        ctx.font = "italic 24px 'Playfair Display', serif";
        ctx.fillText("Kogi East rallies behind Rt. Hon. Halims for 2027", W / 2, 360);

        // Rule
        ctx.fillStyle = "#C9A227";
        ctx.fillRect(200, 390, W - 400, 2);

        // Large candidate photo in center
        ctx.strokeStyle = "#1A1A1A";
        ctx.lineWidth = 3;
        ctx.strokeRect(150, 420, W - 300, 500);
        drawCoverPhoto(chiefPhoto, 153, 423, W - 306, 494);

        // Photo caption
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.font = "italic 14px 'Playfair Display', serif";
        ctx.fillText("Rt. Hon. (Dr.) Abdullahi Ibrahim Ali — The People's Choice", W / 2, 945);

        // Rule
        ctx.fillStyle = "#1A1A1A";
        ctx.fillRect(60, 970, W - 120, 1);

        // Endorsement section styled like a newspaper quote
        ctx.fillStyle = "#004d2e";
        ctx.fillRect(80, 1000, 6, 160);

        drawCirclePhoto(ctx, supporterPhoto, 180, 1080, 70, "#004d2e", "Photo");

        ctx.textAlign = "left";
        ctx.fillStyle = "#1A1A1A";
        ctx.font = "italic 22px 'Playfair Display', serif";
        wrapText(ctx, '"I proudly endorse Rt. Hon. Halims for the Senate. He is the voice Kogi East needs."', 280, 1010, W - 380, 28, "left");

        ctx.fillStyle = "#1A1A1A";
        ctx.font = "900 28px 'Inter', sans-serif";
        ctx.fillText("— " + (userName || "Your Name").toUpperCase(), 280, 1130);

        if (userLocation) {
            ctx.fillStyle = "#8b0000";
            ctx.font = "600 16px 'Inter', sans-serif";
            ctx.fillText(userLocation, 280, 1160);
        }

        // Bottom rule
        ctx.fillStyle = "#1A1A1A";
        ctx.fillRect(60, 1200, W - 120, 2);
    }

    /* ================================================================
       TEMPLATE 5 — "SPOTLIGHT" (modern_apc)
       Pitch black background. A dramatic single overhead spotlight
       illuminates the candidate. Stark, theatrical, high contrast.
       ================================================================ */
    else if (id === "modern_apc") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, W, H);

        // Spotlight cone: radial gradient from center-top
        const spot = ctx.createRadialGradient(W / 2, 0, 50, W / 2, 500, 600);
        spot.addColorStop(0, "rgba(255,255,255,0.25)");
        spot.addColorStop(0.5, "rgba(255,255,255,0.06)");
        spot.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = spot;
        ctx.fillRect(0, 0, W, H);

        // Candidate in center, within the spotlight
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(W / 2 - 350, 100);
        ctx.lineTo(W / 2 + 350, 100);
        ctx.lineTo(W / 2 + 350, 900);
        ctx.lineTo(W / 2 - 350, 900);
        ctx.clip();
        drawCoverPhoto(chiefPhoto, W / 2 - 350, 100, 700, 800);
        // Fade bottom of candidate
        const fadeBot = ctx.createLinearGradient(0, 700, 0, 900);
        fadeBot.addColorStop(0, "rgba(0,0,0,0)");
        fadeBot.addColorStop(1, "rgba(0,0,0,1)");
        ctx.fillStyle = fadeBot;
        ctx.fillRect(0, 700, W, 200);
        ctx.restore();

        // Green and red thin lines framing the photo
        ctx.strokeStyle = "#004d2e";
        ctx.lineWidth = 3;
        ctx.strokeRect(W / 2 - 355, 95, 5, 810);
        ctx.strokeStyle = "#8b0000";
        ctx.strokeRect(W / 2 + 350, 95, 5, 810);

        // Logos
        drawLogo(ctx, senateLogo, W / 2 - 60, 30, 55);
        drawLogo(ctx, adcLogo, W / 2 + 60, 35, 50);

        // Name below the spotlight
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 italic 72px 'Playfair Display', serif";
        ctx.shadowColor = "rgba(201,162,39,0.3)"; ctx.shadowBlur = 20;
        wrapText(ctx, "Rt. Hon. Halims", W / 2, 960, W - 100, 80);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#C9A227";
        ctx.font = "700 20px 'Inter', sans-serif";
        ctx.letterSpacing = "8px";
        ctx.fillText("FOR SENATE • 2027", W / 2, 1060);
        ctx.letterSpacing = "0px";

        // Supporter: small elegant section at very bottom
        drawCirclePhoto(ctx, supporterPhoto, 200, 1170, 60, "#C9A227", "Photo");

        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "600 13px 'Inter', sans-serif";
        ctx.letterSpacing = "3px";
        ctx.fillText("ENDORSED BY", 290, 1140);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 30px 'Inter', sans-serif";
        wrapText(ctx, (userName || "Your Name").toUpperCase(), 290, 1175, W - 400, 34, "left");

        if (userLocation) {
            ctx.fillStyle = "#C9A227";
            ctx.font = "500 16px 'Inter', sans-serif";
            ctx.fillText("📍 " + userLocation, 290, 1210);
        }
    }

    /* ================================================================
       TEMPLATE 6 — "THE DECLARATION" (premium_halims)
       Formal, certificate-like design. Parchment background with
       ornamental green and red border. Centered layout with
       formal serif typography, like an official decree.
       ================================================================ */
    else {
        // Parchment base
        ctx.fillStyle = "#F8F0E0";
        ctx.fillRect(0, 0, W, H);

        // Outer green border
        ctx.strokeStyle = "#004d2e";
        ctx.lineWidth = 20;
        ctx.strokeRect(25, 25, W - 50, H - 150);

        // Inner red border
        ctx.strokeStyle = "#8b0000";
        ctx.lineWidth = 4;
        ctx.strokeRect(50, 50, W - 100, H - 200);

        // Corner ornaments (small gold squares)
        ctx.fillStyle = "#C9A227";
        const cs = 20;
        ctx.fillRect(45, 45, cs, cs);
        ctx.fillRect(W - 45 - cs, 45, cs, cs);
        ctx.fillRect(45, H - 155, cs, cs);
        ctx.fillRect(W - 45 - cs, H - 155, cs, cs);

        // Header
        ctx.textAlign = "center";
        ctx.fillStyle = "#004d2e";
        ctx.font = "700 16px 'Inter', sans-serif";
        ctx.letterSpacing = "10px";
        ctx.fillText("FEDERAL REPUBLIC OF NIGERIA", W / 2, 110);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#8b0000";
        ctx.font = "italic 18px 'Playfair Display', serif";
        ctx.fillText("The Nigerian Senate  •  10th Assembly  •  2027", W / 2, 140);

        // Logos
        drawLogo(ctx, senateLogo, W / 2 - 80, 160, 70);
        drawLogo(ctx, adcLogo, W / 2 + 80, 165, 65);

        // Gold divider
        ctx.fillStyle = "#C9A227";
        ctx.fillRect(200, 250, W - 400, 2);

        // "DECLARATION OF SUPPORT"
        ctx.fillStyle = "#1A1A1A";
        ctx.font = "900 36px 'Playfair Display', serif";
        ctx.letterSpacing = "4px";
        ctx.fillText("DECLARATION OF SUPPORT", W / 2, 300);
        ctx.letterSpacing = "0px";

        // Candidate photo - oval/rounded rect frame
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(W / 2, 520, 200, 230, 0, 0, Math.PI * 2);
        ctx.clip();
        drawCoverPhoto(chiefPhoto, W / 2 - 220, 280, 440, 480);
        ctx.restore();
        // Oval border
        ctx.strokeStyle = "#C9A227";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(W / 2, 520, 205, 235, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Candidate name below oval
        ctx.fillStyle = "#004d2e";
        ctx.font = "900 italic 52px 'Playfair Display', serif";
        ctx.fillText("Rt. Hon. Halims", W / 2, 810);

        ctx.fillStyle = "#8b0000";
        ctx.font = "700 18px 'Inter', sans-serif";
        ctx.letterSpacing = "5px";
        ctx.fillText("APC SENATORIAL CANDIDATE", W / 2, 850);
        ctx.letterSpacing = "0px";

        // Declaration text
        ctx.fillStyle = "#333333";
        ctx.font = "italic 20px 'Playfair Display', serif";
        wrapText(ctx, "I hereby declare my full support and endorsement for the candidacy of Rt. Hon. (Dr.) Abdullahi Ibrahim Ali for the Kogi East Senatorial District in the 2027 General Elections.", W / 2, 910, W - 250, 28);

        // Gold divider
        ctx.fillStyle = "#C9A227";
        ctx.fillRect(300, 1030, W - 600, 2);

        // Supporter signature area
        drawCirclePhoto(ctx, supporterPhoto, W / 2, 1100, 55, "#004d2e", "Photo");

        ctx.fillStyle = "#1A1A1A";
        ctx.font = "800 28px 'Inter', sans-serif";
        ctx.fillText((userName || "Your Name").toUpperCase(), W / 2, 1185);

        if (userLocation) {
            ctx.fillStyle = "#8b0000";
            ctx.font = "500 16px 'Inter', sans-serif";
            ctx.fillText(userLocation, W / 2, 1215);
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
