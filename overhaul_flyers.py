
file_path = r"c:\xampp\htdocs\halims\app\endorsement\EndorsementPageClient.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# We want to replace everything from line 142 (0-indexed 141) to line 531 (0-indexed 530)
# That's: const { accent ... } through to the closing } of renderFlyer
# Keep lines 0..140 (first 141 lines) and lines 531.. (from line 532 onward)

before = lines[:141]  # lines 1-141 (0-indexed 0-140)
after = lines[531:]   # lines 532+ (0-indexed 531+)

new_render = r'''    const { accent, secondary, id } = template;
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
'''

with open(file_path, "w", encoding="utf-8") as f:
    for line in before:
        f.write(line)
    f.write(new_render)
    for line in after:
        f.write(line)

print("Done — complete overhaul applied.")
