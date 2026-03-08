import re
import os

file_path = r"c:\xampp\htdocs\halims\app\endorsement\EndorsementPageClient.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# Update templates metadata
new_templates = """const templates: Template[] = [
    { id: "senate_crimson", name: "Abstract Waves", preview: "linear-gradient(90deg, #004d2e 33%, #8b0000 66%, #8b0000)", bg: "#004d2e", accent: "#C9A227", secondary: "#FFFFFF", textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.85)" },
    { id: "nass_prestige", name: "The Seal", preview: "linear-gradient(135deg, #FAFAFA, #004d2e)", bg: "#FAFAFA", accent: "#004d2e", secondary: "#8b0000", textPrimary: "#1A1A1A", textSecondary: "#333333" },
    { id: "golden_mandate", name: "Golden Horizon", preview: "linear-gradient(135deg, #C9A227, #0A1628)", bg: "#0A1628", accent: "#C9A227", secondary: "#FFFFFF", textPrimary: "#FFFFFF", textSecondary: "#C9A227" },
    { id: "glass_chamber", name: "Dynamic Motion", preview: "linear-gradient(135deg, #8b0000, #004d2e)", bg: "#8b0000", accent: "#FFFFFF", secondary: "#004d2e", textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.9)" },
    { id: "modern_apc", name: "Elegant Glass", preview: "linear-gradient(135deg, #004d2e, #002211)", bg: "#002211", accent: "#C9A227", secondary: "#FFFFFF", textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.8)" },
    { id: "premium_halims", name: "The Declaration", preview: "linear-gradient(135deg, #F8F0E0, #004d2e)", bg: "#F8F0E0", accent: "#004d2e", secondary: "#8b0000", textPrimary: "#1A1A1A", textSecondary: "#C9A227" },
];"""

text = re.sub(r'const templates: Template\[\] = \[.*?\];', new_templates, text, flags=re.DOTALL)

# Update render function body
new_body = r'''    const { accent, secondary, id } = template;
    const senateLogo = igalaBg;

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

    if (id === "senate_crimson") {
        // Abstract Waves with NASS Image
        ctx.fillStyle = "#F8F9FA";
        ctx.fillRect(0, 0, W, H);
        
        // Draw NASS Background
        if (nassBg) {
            ctx.save();
            ctx.globalAlpha = 0.15; // Subtle watermark effect
            drawCoverPhoto(nassBg, 0, 0, W, H);
            ctx.restore();
        }

        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#004d2e";
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W,0); ctx.lineTo(W,250);
        ctx.bezierCurveTo(W*0.7,350, W*0.3,120, 0,270); ctx.fill();
        
        ctx.fillStyle = "#8b0000";
        ctx.beginPath(); ctx.moveTo(0,H); ctx.lineTo(W,H); ctx.lineTo(W, H-300);
        ctx.bezierCurveTo(W*0.7, H-500, W*0.3, H-200, 0, H-400); ctx.fill();
        ctx.globalAlpha = 1.0;
        
        ctx.save(); ctx.beginPath(); ctx.arc(W/2, H/2-60, 360, 0, Math.PI*2); ctx.clip();
        drawCoverPhoto(chiefPhoto, W/2-360, H/2-420, 720, 720); ctx.restore();
        
        ctx.strokeStyle = "#C9A227"; ctx.lineWidth = 12;
        ctx.beginPath(); ctx.arc(W/2, H/2-60, 360, 0, Math.PI*2); ctx.stroke();
        
        drawLogo(ctx, senateLogo, 130, 40, 110); drawLogo(ctx, adcLogo, W-130, 45, 105);
        
        ctx.textAlign="center"; ctx.fillStyle="#FFFFFF";
        ctx.font="900 italic 95px 'Playfair Display', serif"; ctx.shadowColor="rgba(0,0,0,0.6)"; ctx.shadowBlur=15;
        wrapText(ctx, "Rt. Hon. Halims", W/2, H-220, W-100, 100); ctx.shadowBlur=0;
        
        ctx.fillStyle="#C9A227"; ctx.font="800 32px 'Inter', sans-serif"; ctx.letterSpacing="8px";
        ctx.fillText("FOR SENATE 2027", W/2, H-150); ctx.letterSpacing="0px";
        
        // Supporter Card moved to not overlap
        drawCirclePhoto(ctx, supporterPhoto, 170, H-520, 85, "#FFFFFF", "Photo");
        ctx.textAlign="left"; ctx.fillStyle="#1A1A1A"; ctx.font="600 20px 'Inter', sans-serif"; ctx.fillText("ENDORSED BY", 280, H-550);
        ctx.font="900 40px 'Inter', sans-serif"; wrapText(ctx, (userName||"Your Name").toUpperCase(), 280, H-500, W-320, 45, "left");
        if(userLocation) { ctx.fillStyle="#8b0000"; ctx.font="700 22px 'Inter', sans-serif"; ctx.fillText("📍 "+userLocation, 280, H-445); }

    } else if (id === "nass_prestige") {
        ctx.fillStyle = "#FAFAFA"; ctx.fillRect(0, 0, W, H);
        const cx=W/2, cy=460, outerR=330;
        ctx.strokeStyle="#004d2e"; ctx.lineWidth=35; ctx.beginPath(); ctx.arc(cx,cy,outerR,Math.PI*0.65, Math.PI*1.35); ctx.stroke();
        ctx.strokeStyle="#8b0000"; ctx.lineWidth=35; ctx.beginPath(); ctx.arc(cx,cy,outerR,Math.PI*1.65, Math.PI*0.35); ctx.stroke();
        ctx.strokeStyle="#C9A227"; ctx.lineWidth=6; ctx.beginPath(); ctx.arc(cx,cy,outerR-25,0,Math.PI*2); ctx.stroke();
        
        ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,outerR-30,0,Math.PI*2); ctx.clip();
        drawCoverPhoto(chiefPhoto, cx-outerR, cy-outerR, outerR*2, outerR*2); ctx.restore();
        
        // Massive logos
        drawLogo(ctx, senateLogo, 180, 50, 140); drawLogo(ctx, adcLogo, W-180, 55, 130);
        
        ctx.textAlign="center"; ctx.fillStyle="#004d2e"; 
        // Massive Text
        ctx.font="900 110px 'Playfair Display', serif"; ctx.fillText("HALIMS", cx, cy+outerR+100);
        ctx.fillStyle="#8b0000"; ctx.font="800 40px 'Inter', sans-serif"; ctx.letterSpacing="10px"; ctx.fillText("FOR SENATE 2027", cx, cy+outerR+160); ctx.letterSpacing="0px";
        
        ctx.fillStyle="#FFFFFF"; ctx.shadowColor="rgba(0,0,0,0.08)"; ctx.shadowBlur=35; ctx.shadowOffsetY=8;
        roundRect(ctx, 80, 970, W-160, 260, 24); ctx.fill(); ctx.shadowBlur=0;
        ctx.fillStyle="#004d2e"; roundRect(ctx, 80, 970, W-160, 8, 24); ctx.fill();
        
        // Slightly bigger supporter photo and text
        drawCirclePhoto(ctx, supporterPhoto, 220, 1100, 100, "#8b0000", "Photo");
        ctx.textAlign="left"; ctx.fillStyle="rgba(0,0,0,0.5)"; ctx.font="700 20px 'Inter', sans-serif"; ctx.letterSpacing="5px"; ctx.fillText("PROUDLY ENDORSED BY", 350, 1040); ctx.letterSpacing="0px";
        ctx.fillStyle="#1A1A1A"; ctx.font="900 52px 'Inter', sans-serif"; wrapText(ctx, (userName||"Your Name").toUpperCase(), 350, 1095, W-440, 52, "left");
        if(userLocation) { ctx.fillStyle="#8b0000"; ctx.font="600 24px 'Inter', sans-serif"; ctx.fillText("📍 "+userLocation, 350, 1170); }

    } else if (id === "golden_mandate") {
        // GOLDEN HORIZON
        const bgGrad = ctx.createLinearGradient(0,0, 0, H);
        bgGrad.addColorStop(0, "#08101a");
        bgGrad.addColorStop(1, "#0A2015");
        ctx.fillStyle = bgGrad; ctx.fillRect(0,0,W,H);

        // Huge glowing sun/gold ring
        ctx.save();
        ctx.shadowColor = "#C9A227"; ctx.shadowBlur = 100;
        ctx.strokeStyle = "rgba(201,162,39,0.3)"; ctx.lineWidth = 15;
        ctx.beginPath(); ctx.arc(W/2, 450, 400, 0, Math.PI*2); ctx.stroke();
        ctx.restore();

        // Elegant geometric slashes
        ctx.fillStyle = "#C9A227"; ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.moveTo(0, H-350); ctx.lineTo(W, H-550); ctx.lineTo(W, H-530); ctx.lineTo(0, H-330); ctx.fill();
        ctx.fillStyle = "#8b0000"; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.moveTo(0, H-300); ctx.lineTo(W, H-500); ctx.lineTo(W, H-430); ctx.lineTo(0, H-230); ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.save();
        ctx.beginPath();
        // create an arched mask
        ctx.moveTo(0,H); ctx.lineTo(W,H); ctx.lineTo(W,300);
        ctx.quadraticCurveTo(W/2, 0, 0, 300); ctx.closePath(); ctx.clip();
        drawCoverPhoto(chiefPhoto, 0, 150, W, H-150);
        
        const photoFade = ctx.createLinearGradient(0, H-600, 0, H-150);
        photoFade.addColorStop(0, "rgba(8,16,26,0)");
        photoFade.addColorStop(1, "rgba(8,16,26,1)");
        ctx.fillStyle = photoFade; ctx.fillRect(0,H-600, W, 600);
        ctx.restore();

        drawLogo(ctx, senateLogo, 130, 60, 110); drawLogo(ctx, adcLogo, W-130, 65, 100);

        ctx.textAlign="center"; ctx.fillStyle="#C9A227";
        ctx.font="900 130px 'Playfair Display', serif"; ctx.shadowColor="rgba(0,0,0,0.8)"; ctx.shadowBlur=20;
        ctx.fillText("HALIMS", W/2, H-250); ctx.shadowBlur=0;
        
        ctx.fillStyle="#FFFFFF"; ctx.font="700 36px 'Inter', sans-serif"; ctx.letterSpacing="14px";
        ctx.fillText("FOR SENATE 2027", W/2, H-180); ctx.letterSpacing="0px";

        // Supporter Card - elegant outline
        ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth=2;
        roundRect(ctx, 50, H-110, W-100, 110, 20); ctx.fill(); ctx.stroke();
        
        drawCirclePhoto(ctx, supporterPhoto, 120, H-55, 45, "#C9A227", "Photo");
        ctx.textAlign="left"; ctx.fillStyle="rgba(255,255,255,0.6)"; ctx.font="500 16px 'Inter', sans-serif"; ctx.letterSpacing="4px";
        ctx.fillText("SUPPORTED BY", 190, H-65); ctx.letterSpacing="0px";
        ctx.fillStyle="#FFFFFF"; ctx.font="700 24px 'Inter', sans-serif"; ctx.fillText((userName||"Name").toUpperCase(), 190, H-35);
        if(userLocation){ ctx.textAlign="right"; ctx.fillStyle="#C9A227"; ctx.font="600 20px 'Inter', sans-serif"; ctx.fillText("📍 "+userLocation, W-80, H-50); }

    } else if (id === "glass_chamber") {
        // DYNAMIC MOTION
        ctx.fillStyle="#FFFFFF"; ctx.fillRect(0,0,W,H);
        
        // Dynamic angled ribbon background
        ctx.fillStyle = "#8b0000"; // Red
        ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(W, H); ctx.lineTo(W, 300); ctx.lineTo(0, 700); ctx.fill();

        ctx.fillStyle = "#004d2e"; // Green overlay
        ctx.beginPath(); ctx.moveTo(W, H); ctx.lineTo(150, H); ctx.lineTo(W, 400); ctx.fill();

        // White slash
        ctx.fillStyle = "#FAFAFA";
        ctx.beginPath(); ctx.moveTo(0, 500); ctx.lineTo(W, 100); ctx.lineTo(W, 250); ctx.lineTo(0, 650); ctx.fill();
        ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur=25; ctx.shadowOffsetY=10;
        
        // Massive Candidate Photo - overlapping everything with drop shadow
        ctx.save();
        ctx.filter = "drop-shadow(15px 15px 25px rgba(0,0,0,0.5))";
        drawCoverPhoto(chiefPhoto, W/2 - 250, 100, 650, 950);
        ctx.restore();

        // 3D Text behind and in front
        ctx.textAlign="left"; ctx.fillStyle="#004d2e";
        ctx.font="900 160px 'Inter', sans-serif"; ctx.letterSpacing="-5px"; 
        ctx.fillText("HALIMS", 40, 300); ctx.letterSpacing="0px";
        
        ctx.fillStyle="#FFFFFF"; ctx.font="900 52px 'Inter', sans-serif"; ctx.shadowColor="rgba(0,0,0,0.5)"; ctx.shadowBlur=10;
        ctx.fillText("FOR SENATE", 50, H-450);
        ctx.fillStyle="#C9A227"; ctx.fillText("2027", 50, H-390); ctx.shadowBlur=0;

        drawLogo(ctx, senateLogo, W-140, 60, 100); drawLogo(ctx, adcLogo, W-140, 180, 90);

        // Supporter clean panel
        ctx.fillStyle = "#FFFFFF"; ctx.shadowColor = "rgba(0,0,0,0.15)"; ctx.shadowBlur=20; ctx.shadowOffsetY=5;
        roundRect(ctx, 40, H-300, 500, 260, 20); ctx.fill(); ctx.shadowBlur=0;

        drawCirclePhoto(ctx, supporterPhoto, 120, H-170, 60, "#8b0000", "Photo");
        ctx.fillStyle="#1A1A1A"; ctx.font="900 32px 'Inter', sans-serif"; wrapText(ctx, (userName||"Your Name").toUpperCase(), 200, H-210, 300, 35, "left");
        ctx.fillStyle="#004d2e"; ctx.font="800 18px 'Inter', sans-serif"; ctx.letterSpacing="2px"; ctx.fillText("OFFICIAL SUPPORTER", 200, H-130); ctx.letterSpacing="0px";
        if(userLocation){ ctx.fillStyle="#8b0000"; ctx.font="600 20px 'Inter', sans-serif"; ctx.fillText("📍 "+userLocation, 200, H-100); }

    } else if (id === "modern_apc") {
        // ELEGANT GLASSMORPHISM
        // Very deep and subtle blend
        const bgGrad = ctx.createLinearGradient(0,0, W, H);
        bgGrad.addColorStop(0, "#012a19");
        bgGrad.addColorStop(1, "#030e09");
        ctx.fillStyle = bgGrad; ctx.fillRect(0,0,W,H);

        // Blurred background color spots
        ctx.save();
        ctx.fillStyle = "#8b0000"; ctx.filter = "blur(140px)";
        ctx.beginPath(); ctx.arc(W-200, 200, 350, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#008751";
        ctx.beginPath(); ctx.arc(200, H-200, 400, 0, Math.PI*2); ctx.fill();
        ctx.restore();

        // Unique angular framing container for candidate
        ctx.save();
        ctx.beginPath(); ctx.moveTo(W/2, 50); ctx.lineTo(W-50, 200); ctx.lineTo(W-50, 750); ctx.lineTo(W/2, 900); ctx.lineTo(50, 750); ctx.lineTo(50, 200); ctx.closePath();
        ctx.clip();
        drawCoverPhoto(chiefPhoto, 0, 0, W, 950);
        ctx.restore();
        
        ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth=3;
        ctx.beginPath(); ctx.moveTo(W/2, 50); ctx.lineTo(W-50, 200); ctx.lineTo(W-50, 750); ctx.lineTo(W/2, 900); ctx.lineTo(50, 750); ctx.lineTo(50, 200); ctx.closePath(); ctx.stroke();

        drawLogo(ctx, senateLogo, 160, 60, 110); drawLogo(ctx, adcLogo, W-160, 65, 105);

        // Stunning Glass Panel
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 40;
        roundRect(ctx, 40, H-420, W-80, 300, 35); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;

        ctx.textAlign="center"; ctx.fillStyle="#FFFFFF";
        ctx.font="900 italic 85px 'Playfair Display', serif"; ctx.fillText("Rt. Hon. Halims", W/2, H-310);
        ctx.fillStyle="#C9A227"; ctx.font="800 28px 'Inter', sans-serif"; ctx.letterSpacing="10px"; ctx.fillText("FOR SENATE 2027", W/2, H-250); ctx.letterSpacing="0px";

        drawCirclePhoto(ctx, supporterPhoto, 120, H-280, 60, "#FFFFFF", "Photo");
        ctx.textAlign="left"; ctx.fillStyle="rgba(255,255,255,0.7)"; ctx.font="700 16px 'Inter', sans-serif"; ctx.letterSpacing="3px"; ctx.fillText("ENDORSED BY", 200, H-300);
        ctx.fillStyle="#FFFFFF"; ctx.font="800 30px 'Inter', sans-serif"; ctx.fillText((userName||"Name").toUpperCase(), 200, H-265);
        if(userLocation){ ctx.fillStyle="#C9A227"; ctx.font="600 18px 'Inter', sans-serif"; ctx.fillText("📍 "+userLocation, 200, H-235); }

    } else {
        // THE DECLARATION (Refined per feedback)
        ctx.fillStyle="#F8F0E0"; ctx.fillRect(0,0,W,H); ctx.strokeStyle="#004d2e"; ctx.lineWidth=24; ctx.strokeRect(25,25,W-50,H-130);
        ctx.strokeStyle="#8b0000"; ctx.lineWidth=8; ctx.strokeRect(55,55,W-110,H-190);
        ctx.fillStyle="#C9A227"; const cs=30; ctx.fillRect(45,45,cs,cs); ctx.fillRect(W-45-cs,45,cs,cs); ctx.fillRect(45,H-145,cs,cs); ctx.fillRect(W-45-cs,H-145,cs,cs);
        
        ctx.textAlign="center"; ctx.fillStyle="#004d2e"; ctx.font="900 24px 'Inter', sans-serif"; ctx.letterSpacing="12px"; ctx.fillText("FEDERAL REPUBLIC OF NIGERIA", W/2, 120); ctx.letterSpacing="0px";
        ctx.fillStyle="#8b0000"; ctx.font="italic 26px 'Playfair Display', serif"; ctx.fillText("The Nigerian Senate  •  10th Assembly  •  2027", W/2, 160);
        
        drawLogo(ctx, senateLogo, W/2-110, 180, 120); drawLogo(ctx, adcLogo, W/2+110, 185, 115);
        ctx.fillStyle="#C9A227"; ctx.fillRect(150, 310, W-300, 3);
        
        // ** MOVED LOWER TO NOT OVERLAP PHOTO **
        ctx.fillStyle="#1A1A1A"; ctx.font="900 58px 'Playfair Display', serif"; ctx.letterSpacing="6px"; ctx.fillText("DECLARATION OF SUPPORT", W/2, 380); ctx.letterSpacing="0px";
        
        // ** PHOTO OVAL SCALED DOWN SLIGHTLY AND POSITIONED LOWER **
        ctx.save(); ctx.beginPath(); ctx.ellipse(W/2, 630, 200, 230, 0, 0, Math.PI*2); ctx.clip();
        drawCoverPhoto(chiefPhoto, W/2-240, 400, 480, 500); ctx.restore();
        ctx.strokeStyle="#C9A227"; ctx.lineWidth=8; ctx.beginPath(); ctx.ellipse(W/2, 630, 206, 236, 0, 0, Math.PI*2); ctx.stroke();
        
        // HUGE TEXT AS REQUESTED
        ctx.fillStyle="#004d2e"; ctx.font="900 italic 96px 'Playfair Display', serif"; ctx.fillText("Rt. Hon. Halims", W/2, 940);
        
        ctx.fillStyle="#8b0000"; ctx.font="800 24px 'Inter', sans-serif"; ctx.letterSpacing="6px"; ctx.fillText("APC SENATORIAL CANDIDATE, KOGI EAST", W/2, 990); ctx.letterSpacing="0px";
        
        ctx.fillStyle="#333333"; ctx.font="italic 28px 'Playfair Display', serif"; wrapText(ctx, "I hereby declare my full support and endorsement for the candidacy of Rt. Hon. (Dr.) Abdullahi Ibrahim Ali for the Kogi East Senatorial District in the 2027 General Elections.", W/2, 1060, W-200, 38);
        
        ctx.fillStyle="#C9A227"; ctx.fillRect(250, 1150, W-500, 3);
        
        // ** SUPPORTER FIXED: VISIBLE, READABLE, PROPERLY ALIGNED **
        drawCirclePhoto(ctx, supporterPhoto, W/2-220, 1210, 55, "#004d2e", "Photo");
        ctx.textAlign="left"; ctx.fillStyle="#1A1A1A"; ctx.font="800 42px 'Inter', sans-serif"; wrapText(ctx, (userName||"Your Name").toUpperCase(), W/2-140, 1205, W/2, 42, "left");
        if(userLocation){ ctx.fillStyle="#8b0000"; ctx.font="600 22px 'Inter', sans-serif"; ctx.fillText(userLocation, W/2-140, 1245); }
    }

    /* ── BOTTOM BANNER (all templates) ── */
    const bannerH = 80;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, H - bannerH, W, bannerH);
    ctx.fillStyle = "#C9A227";
    ctx.fillRect(0, H - bannerH, W, 4);
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 24px 'Inter', sans-serif";
    ctx.letterSpacing = "3px";
    ctx.fillText("VOTE APC • KOGI EAST SENATE • 2027", W / 2, H - 45);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "600 18px 'Inter', sans-serif";
    ctx.fillText("Powered by Hamis4Halims", W / 2, H - 15);
}'''

start_str = "    const { accent, secondary, id } = template;"
end_str = "ctx.fillText(\"Powered by"

start_idx = text.find(start_str)
end_idx = text.find("}", text.find(end_str)) + 1

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_body + text[end_idx:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Success")
else:
    print("Could not find boundaries")
