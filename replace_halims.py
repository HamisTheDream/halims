import re

file_path = r"c:\xampp\htdocs\halims\app\endorsement\EndorsementPageClient.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update NASS Prestige
new_nass_prestige = """    else if (id === "nass_prestige") {
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
    }"""

pattern1 = r'    else if \(id === "nass_prestige"\) \{.*?(?=    \/\* ════════════════════════════════════════════════════════════════\n       3\. )'
content = re.sub(pattern1, new_nass_prestige + "\n\n", content, flags=re.DOTALL)


# 2. Update Golden Mandate
new_golden_mandate = """    else if (id === "golden_mandate") {
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
    }"""

pattern2 = r'    else if \(id === "golden_mandate"\) \{.*?(?=    \/\* ════════════════════════════════════════════════════════════════\n       4\. )'
content = re.sub(pattern2, new_golden_mandate + "\n\n", content, flags=re.DOTALL)

# 3. Update Modern APC text
new_modern_apc = """    else if (id === "modern_apc") {
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
    }"""

# For modern apc, in the code it's either "4. THE GRASSROOTS MOBILIZER" or "5. MODERN APC" or something
# We can search for `    else if (id === "modern_apc") {` up to `else if (id === "glass_chamber") {` or `else {`
pattern3 = r'    else if \(id === "modern_apc"\) \{.*?(?=    \/\* ════════════════════════════════════════════════════════════════\n       (?:5|4)\. )'
# Wait, glass chamber is after modern_apc sometimes. Let's just find `    /* ══════`
pattern3 = r'    else if \(id === "modern_apc"\) \{.*?(?=    \/\* ════════════════════════════════════════════════════════════════\n)'
content = re.sub(pattern3, new_modern_apc + "\n\n", content, flags=re.DOTALL)

# 4. Update Glass Chamber
new_glass_chamber = """    else if (id === "glass_chamber") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, W, H);
        
        ctx.fillStyle = "#005a36";
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(W, 300); ctx.lineTo(W, 450); ctx.lineTo(0, 150);
        ctx.fill();

        ctx.fillStyle = "#C4000C";
        ctx.beginPath();
        ctx.moveTo(0, H - 300); ctx.lineTo(W, H - 150); ctx.lineTo(W, H); ctx.lineTo(0, H);
        ctx.fill();

        drawCoverPhoto(chiefPhoto, W / 2 - 300, 200, 600, 800);
        
        // fade candidate bottom to white
        const cFade = ctx.createLinearGradient(0, 800, 0, 1000);
        cFade.addColorStop(0, "rgba(255, 255, 255, 0)");
        cFade.addColorStop(1, "rgba(255, 255, 255, 1)");
        ctx.fillStyle = cFade;
        ctx.fillRect(W / 2 - 300, 800, 600, 200);

        drawLogo(ctx, senateLogo, 100, 80, 90);
        drawLogo(ctx, adcLogo, W - 100, 85, 80);

        ctx.textAlign = "center";
        ctx.fillStyle = "#005a36";
        ctx.font = "900 italic 72px 'Playfair Display', serif";
        wrapText(ctx, "Rt. Hon. Halims", W / 2, 580, W - 200, 80);
        
        ctx.fillStyle = "#C4000C";
        ctx.font = "800 20px 'Inter', sans-serif";
        ctx.letterSpacing = "8px";
        ctx.fillText("KOGI EAST SENATE 2027", W / 2, 650);

        // Supporter circle
        drawCirclePhoto(ctx, supporterPhoto, W / 2, 900, 90, "#C4000C", "Photo");

        ctx.fillStyle = "#005a36";
        ctx.font = "700 16px 'Inter', sans-serif";
        ctx.letterSpacing = "4px";
        ctx.fillText("PROUDLY ENDORSED BY", W / 2, 1020);
        ctx.letterSpacing = "0px";

        ctx.fillStyle = "#0A1628";
        ctx.font = "800 36px 'Inter', sans-serif";
        let nY = wrapText(ctx, (userName || "Your Name").toUpperCase(), W / 2, 1060, W - 200, 42);

        if (userLocation) {
            ctx.fillStyle = "#C4000C";
            ctx.font = "600 18px 'Inter', sans-serif";
            ctx.fillText("📍 " + userLocation, W / 2, nY + 40);
        }
    }"""

pattern4 = r'    else if \(id === "glass_chamber"\) \{.*?(?=    \/\* ════════════════════════════════════════════════════════════════\n)'
content = re.sub(pattern4, new_glass_chamber + "\n\n", content, flags=re.DOTALL)


# 5. Update Else block (premium_halims)
new_elite_statesman = """    else {
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
    }"""

pattern5 = r'    else \{.*?        ctx\.fillText\("2027", 80, 1000\);\n    \}'
content = re.sub(pattern5, new_elite_statesman, content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
