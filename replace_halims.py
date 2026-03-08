import re

file_path = r"c:\xampp\htdocs\halims\app\endorsement\EndorsementPageClient.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# Update templates metadata
new_templates = """const templates: Template[] = [
    { id: "senate_crimson", name: "Abstract Waves", preview: "linear-gradient(90deg, #004d2e 33%, #8b0000 66%, #8b0000)", bg: "#004d2e", accent: "#C9A227", secondary: "#FFFFFF", textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.85)" },
    { id: "nass_prestige", name: "The Seal", preview: "linear-gradient(135deg, #FAFAFA, #004d2e)", bg: "#FAFAFA", accent: "#004d2e", secondary: "#8b0000", textPrimary: "#1A1A1A", textSecondary: "#333333" },
    { id: "golden_mandate", name: "Geometric Block", preview: "linear-gradient(135deg, #004d2e, #111111, #8b0000)", bg: "#111111", accent: "#C9A227", secondary: "#004d2e", textPrimary: "#FFFFFF", textSecondary: "#C9A227" },
    { id: "glass_chamber", name: "Minimalist Grid", preview: "linear-gradient(135deg, #FFFFFF, #E0E0E0)", bg: "#FFFFFF", accent: "#004d2e", secondary: "#8b0000", textPrimary: "#1A1A1A", textSecondary: "#666666" },
    { id: "modern_apc", name: "Neon Overlay", preview: "linear-gradient(135deg, #0A0A0A, #004d2e)", bg: "#0A0A0A", accent: "#004d2e", secondary: "#8b0000", textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.7)" },
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
        ctx.fillStyle = "#F8F9FA";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#004d2e";
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W,0); ctx.lineTo(W,250);
        ctx.bezierCurveTo(W*0.7,380, W*0.3,150, 0,300); ctx.fill();
        
        ctx.fillStyle = "#8b0000";
        ctx.beginPath(); ctx.moveTo(0,H); ctx.lineTo(W,H); ctx.lineTo(W, H-350);
        ctx.bezierCurveTo(W*0.7, H-550, W*0.3, H-250, 0, H-450); ctx.fill();
        
        ctx.save(); ctx.beginPath(); ctx.arc(W/2, H/2-40, 360, 0, Math.PI*2); ctx.clip();
        drawCoverPhoto(chiefPhoto, W/2-360, H/2-400, 720, 720); ctx.restore();
        
        ctx.strokeStyle = "#C9A227"; ctx.lineWidth = 12;
        ctx.beginPath(); ctx.arc(W/2, H/2-40, 360, 0, Math.PI*2); ctx.stroke();
        
        drawLogo(ctx, senateLogo, 130, 60, 110); drawLogo(ctx, adcLogo, W-130, 65, 105);
        
        ctx.textAlign="center"; ctx.fillStyle="#FFFFFF";
        ctx.font="900 italic 95px 'Playfair Display', serif"; ctx.shadowColor="rgba(0,0,0,0.6)"; ctx.shadowBlur=15;
        wrapText(ctx, "Rt. Hon. Halims", W/2, H-280, W-100, 100); ctx.shadowBlur=0;
        
        ctx.fillStyle="#C9A227"; ctx.font="800 32px 'Inter', sans-serif"; ctx.letterSpacing="8px";
        ctx.fillText("FOR SENATE 2027", W/2, H-180); ctx.letterSpacing="0px";
        
        drawCirclePhoto(ctx, supporterPhoto, 170, H-170, 85, "#FFFFFF", "Photo");
        ctx.textAlign="left"; ctx.fillStyle="#FFFFFF"; ctx.font="600 20px 'Inter', sans-serif"; ctx.fillText("ENDORSED BY", 280, H-210);
        ctx.font="900 45px 'Inter', sans-serif"; wrapText(ctx, (userName||"Your Name").toUpperCase(), 280, H-160, W-320, 50, "left");
        if(userLocation) { ctx.fillStyle="#C9A227"; ctx.font="700 24px 'Inter', sans-serif"; ctx.fillText("📍 "+userLocation, 280, H-110); }
    } else if (id === "nass_prestige") {
        ctx.fillStyle = "#FAFAFA"; ctx.fillRect(0, 0, W, H);
        const cx=W/2, cy=480, outerR=330;
        ctx.strokeStyle="#004d2e"; ctx.lineWidth=35; ctx.beginPath(); ctx.arc(cx,cy,outerR,Math.PI*0.65, Math.PI*1.35); ctx.stroke();
        ctx.strokeStyle="#8b0000"; ctx.lineWidth=35; ctx.beginPath(); ctx.arc(cx,cy,outerR,Math.PI*1.65, Math.PI*0.35); ctx.stroke();
        ctx.strokeStyle="#C9A227"; ctx.lineWidth=6; ctx.beginPath(); ctx.arc(cx,cy,outerR-25,0,Math.PI*2); ctx.stroke();
        
        ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,outerR-30,0,Math.PI*2); ctx.clip();
        drawCoverPhoto(chiefPhoto, cx-outerR, cy-outerR, outerR*2, outerR*2); ctx.restore();
        
        drawLogo(ctx, senateLogo, 160, 60, 110); drawLogo(ctx, adcLogo, W-160, 65, 105);
        ctx.textAlign="center"; ctx.fillStyle="#004d2e"; ctx.font="900 85px 'Playfair Display', serif"; ctx.fillText("HALIMS", cx, cy+outerR+90);
        ctx.fillStyle="#8b0000"; ctx.font="800 32px 'Inter', sans-serif"; ctx.letterSpacing="10px"; ctx.fillText("FOR SENATE 2027", cx, cy+outerR+140); ctx.letterSpacing="0px";
        
        ctx.fillStyle="#FFFFFF"; ctx.shadowColor="rgba(0,0,0,0.08)"; ctx.shadowBlur=35; ctx.shadowOffsetY=8;
        roundRect(ctx, 80, 970, W-160, 260, 24); ctx.fill(); ctx.shadowBlur=0;
        ctx.fillStyle="#004d2e"; roundRect(ctx, 80, 970, W-160, 8, 24); ctx.fill();
        
        drawCirclePhoto(ctx, supporterPhoto, 220, 1100, 90, "#8b0000", "Photo");
        ctx.textAlign="left"; ctx.fillStyle="rgba(0,0,0,0.4)"; ctx.font="700 18px 'Inter', sans-serif"; ctx.letterSpacing="5px"; ctx.fillText("PROUDLY ENDORSED BY", 340, 1040); ctx.letterSpacing="0px";
        ctx.fillStyle="#1A1A1A"; ctx.font="900 46px 'Inter', sans-serif"; wrapText(ctx, (userName||"Your Name").toUpperCase(), 340, 1095, W-440, 52, "left");
        if(userLocation) { ctx.fillStyle="#8b0000"; ctx.font="600 22px 'Inter', sans-serif"; ctx.fillText("📍 "+userLocation, 340, 1160); }
    } else if (id === "golden_mandate") {
        ctx.fillStyle="#004d2e"; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W,0); ctx.lineTo(0,H); ctx.fill();
        ctx.fillStyle="#8b0000"; ctx.beginPath(); ctx.moveTo(W,0); ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.fill();
        ctx.strokeStyle="#FFFFFF"; ctx.lineWidth=18; ctx.beginPath(); ctx.moveTo(0,H); ctx.lineTo(W,0); ctx.stroke();
        
        const pt=220, pb=H-420; ctx.save(); ctx.beginPath(); ctx.moveTo(W/2, pt); ctx.lineTo(W-120, (pb+pt)/2); ctx.lineTo(W/2, pb); ctx.lineTo(120, (pb+pt)/2); ctx.closePath(); ctx.clip();
        drawCoverPhoto(chiefPhoto, 120, pt, W-240, pb-pt); ctx.restore();
        ctx.strokeStyle="#C9A227"; ctx.lineWidth=12; ctx.beginPath(); ctx.moveTo(W/2, pt); ctx.lineTo(W-120, (pb+pt)/2); ctx.lineTo(W/2, pb); ctx.lineTo(120, (pb+pt)/2); ctx.closePath(); ctx.stroke();
        
        drawLogo(ctx, senateLogo, 140, 80, 110); drawLogo(ctx, adcLogo, W-140, 85, 105);
        ctx.textAlign="center"; ctx.fillStyle="#FFFFFF"; ctx.font="900 110px 'Inter', sans-serif"; ctx.shadowColor="rgba(0,0,0,0.6)"; ctx.shadowBlur=20;
        ctx.fillText("HALIMS", W/2, H-280); ctx.font="800 45px 'Inter', sans-serif"; ctx.letterSpacing="15px"; ctx.fillText("FOR SENATE 2027", W/2, H-200); ctx.letterSpacing="0px"; ctx.shadowBlur=0;
        
        drawCirclePhoto(ctx, supporterPhoto, W/2-250, H-100, 75, "#FFFFFF", "Photo");
        ctx.textAlign="left"; ctx.fillStyle="#FFFFFF"; ctx.font="700 20px 'Inter', sans-serif"; ctx.fillText("ENDORSED BY:", W/2-150, H-120);
        ctx.font="900 38px 'Inter', sans-serif"; wrapText(ctx, (userName||"Your Name").toUpperCase(), W/2-150, H-80, W/2+100, 42, "left");
    } else if (id === "glass_chamber") {
        ctx.fillStyle="#FFFFFF"; ctx.fillRect(0,0,W,H); ctx.strokeStyle="#EBEBEB"; ctx.lineWidth=3;
        const cw=W/6, rh=H/8;
        for(let x=0; x<=W; x+=cw){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
        for(let y=0; y<=H; y+=rh){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
        ctx.fillStyle="#004d2e"; ctx.fillRect(0,0,cw*2,rh*2); ctx.fillStyle="#8b0000"; ctx.fillRect(cw*4,rh*6,cw*2,rh*2);
        const px=cw, py=rh, pw=cw*4, ph=rh*5; ctx.fillStyle="#1A1A1A"; ctx.fillRect(px,py,pw,ph); drawCoverPhoto(chiefPhoto, px,py,pw,ph);
        
        ctx.textAlign="left"; ctx.fillStyle="#1A1A1A"; ctx.font="900 120px 'Inter', sans-serif"; ctx.fillText("HALIMS", cw+20, rh*6+100);
        ctx.fillStyle="#8b0000"; ctx.font="800 32px 'Inter', sans-serif"; ctx.letterSpacing="12px"; ctx.fillText("FOR SENATE 2027", cw+25, rh*6+150); ctx.letterSpacing="0px";
        drawLogo(ctx, senateLogo, cw, rh, 90); drawLogo(ctx, adcLogo, cw, rh*2+20, 85);
        drawCirclePhoto(ctx, supporterPhoto, W-cw-50, rh*7, 80, "#FFFFFF", "Photo");
        ctx.textAlign="right"; ctx.fillStyle="#FFFFFF"; ctx.font="700 18px 'Inter', sans-serif"; ctx.fillText("ENDORSED BY", W-cw-150, rh*7-15);
        ctx.font="900 32px 'Inter', sans-serif"; ctx.fillText((userName||"Your Name").toUpperCase(), W-cw-150, rh*7+25);
    } else if (id === "modern_apc") {
        ctx.fillStyle="#0A0A0A"; ctx.fillRect(0,0,W,H); ctx.textAlign="center"; ctx.fillStyle="rgba(255,255,255,0.04)";
        ctx.font="900 280px 'Inter', sans-serif"; ctx.fillText("HALIMS", W/2, 450); ctx.fillText("SENATE", W/2, 850);
        ctx.save(); ctx.globalAlpha=0.85; drawCoverPhoto(chiefPhoto, 0, 50, W, H-50); ctx.restore();
        
        const duo = ctx.createLinearGradient(0,0,W,H); duo.addColorStop(0,"rgba(0,77,46,0.45)"); duo.addColorStop(1,"rgba(139,0,0,0.85)");
        ctx.fillStyle=duo; ctx.fillRect(0,0,W,H);
        const bD = ctx.createLinearGradient(0,H-600,0,H); bD.addColorStop(0,"rgba(10,10,10,0)"); bD.addColorStop(1,"rgba(10,10,10,1)");
        ctx.fillStyle=bD; ctx.fillRect(0,H-600,W,600);
        
        ctx.strokeStyle="#C9A227"; ctx.lineWidth=3; ctx.strokeRect(40,40,W-80,H-180);
        drawLogo(ctx, senateLogo, 120, 80, 100); drawLogo(ctx, adcLogo, W-120, 85, 95);
        ctx.textAlign="center"; ctx.fillStyle="#FFFFFF"; ctx.font="900 italic 95px 'Playfair Display', serif"; ctx.shadowColor="#8b0000"; ctx.shadowBlur=40;
        wrapText(ctx, "Rt. Hon. Halims", W/2, H-340, W-100, 105); ctx.shadowColor="transparent";
        ctx.fillStyle="#C9A227"; ctx.font="800 32px 'Inter', sans-serif"; ctx.letterSpacing="15px"; ctx.fillText("FOR SENATE 2027", W/2, H-240); ctx.letterSpacing="0px";
        
        ctx.fillStyle="rgba(255,255,255,0.06)"; roundRect(ctx, W/2-350, H-170, 700, 110, 55); ctx.fill();
        drawCirclePhoto(ctx, supporterPhoto, W/2-270, H-115, 65, "#C9A227", "Photo");
        ctx.textAlign="left"; ctx.fillStyle="rgba(255,255,255,0.6)"; ctx.font="600 16px 'Inter', sans-serif"; ctx.letterSpacing="4px"; ctx.fillText("ENDORSED BY:", W/2-180, H-135); ctx.letterSpacing="0px";
        ctx.fillStyle="#FFFFFF"; ctx.font="800 28px 'Inter', sans-serif"; ctx.fillText((userName||"Your Name").toUpperCase(), W/2-180, H-100);
        if(userLocation) { ctx.textAlign="right"; ctx.fillStyle="#C9A227"; ctx.font="600 20px 'Inter', sans-serif"; ctx.fillText("📍 "+userLocation, W/2+300, H-110); }
    } else {
        ctx.fillStyle="#F8F0E0"; ctx.fillRect(0,0,W,H); ctx.strokeStyle="#004d2e"; ctx.lineWidth=24; ctx.strokeRect(25,25,W-50,H-150);
        ctx.strokeStyle="#8b0000"; ctx.lineWidth=6; ctx.strokeRect(55,55,W-110,H-210);
        ctx.fillStyle="#C9A227"; const cs=26; ctx.fillRect(45,45,cs,cs); ctx.fillRect(W-45-cs,45,cs,cs); ctx.fillRect(45,H-165,cs,cs); ctx.fillRect(W-45-cs,H-165,cs,cs);
        
        ctx.textAlign="center"; ctx.fillStyle="#004d2e"; ctx.font="800 20px 'Inter', sans-serif"; ctx.letterSpacing="12px"; ctx.fillText("FEDERAL REPUBLIC OF NIGERIA", W/2, 120); ctx.letterSpacing="0px";
        ctx.fillStyle="#8b0000"; ctx.font="italic 24px 'Playfair Display', serif"; ctx.fillText("The Nigerian Senate  •  10th Assembly  •  2027", W/2, 160);
        drawLogo(ctx, senateLogo, W/2-100, 180, 100); drawLogo(ctx, adcLogo, W/2+100, 185, 95);
        ctx.fillStyle="#C9A227"; ctx.fillRect(150, 310, W-300, 3);
        ctx.fillStyle="#1A1A1A"; ctx.font="900 48px 'Playfair Display', serif"; ctx.letterSpacing="5px"; ctx.fillText("DECLARATION OF SUPPORT", W/2, 370); ctx.letterSpacing="0px";
        
        ctx.save(); ctx.beginPath(); ctx.ellipse(W/2, 600, 220, 260, 0, 0, Math.PI*2); ctx.clip();
        drawCoverPhoto(chiefPhoto, W/2-240, 340, 480, 520); ctx.restore();
        ctx.strokeStyle="#C9A227"; ctx.lineWidth=6; ctx.beginPath(); ctx.ellipse(W/2, 600, 226, 266, 0, 0, Math.PI*2); ctx.stroke();
        
        ctx.fillStyle="#004d2e"; ctx.font="900 italic 76px 'Playfair Display', serif"; ctx.fillText("Rt. Hon. Halims", W/2, 940);
        ctx.fillStyle="#8b0000"; ctx.font="800 24px 'Inter', sans-serif"; ctx.letterSpacing="6px"; ctx.fillText("APC SENATORIAL CANDIDATE", W/2, 990); ctx.letterSpacing="0px";
        ctx.fillStyle="#333333"; ctx.font="italic 26px 'Playfair Display', serif"; wrapText(ctx, "I hereby declare my full support and endorsement for the candidacy of Rt. Hon. (Dr.) Abdullahi Ibrahim Ali for the Kogi East Senatorial District in the 2027 General Elections.", W/2, 1060, W-200, 36);
        ctx.fillStyle="#C9A227"; ctx.fillRect(250, 1170, W-500, 3);
        
        drawCirclePhoto(ctx, supporterPhoto, W/2-180, 1220, 65, "#004d2e", "Photo");
        ctx.textAlign="left"; ctx.fillStyle="#1A1A1A"; ctx.font="800 36px 'Inter', sans-serif"; ctx.fillText((userName||"Your Name").toUpperCase(), W/2-90, 1220);
        if(userLocation){ ctx.fillStyle="#8b0000"; ctx.font="600 20px 'Inter', sans-serif"; ctx.fillText(userLocation, W/2-90, 1255); }
    }

    /* ── BOTTOM BANNER (all templates) ── */
    const bannerH = 100;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, H - bannerH, W, bannerH);
    ctx.fillStyle = "#C9A227";
    ctx.fillRect(0, H - bannerH, W, 4);
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 24px 'Inter', sans-serif";
    ctx.letterSpacing = "3px";
    ctx.fillText("VOTE APC • KOGI EAST SENATE • 2027", W / 2, H - 55);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "500 14px 'Inter', sans-serif";
    ctx.fillText("Powered by HamisNetwork 4 Halims", W / 2, H - 25);
}'''

# Replace from `    const { accent, secondary, id } = template;` to the end of `renderFlyer` function.
# We will use string finding.

start_str = "    const { accent, secondary, id } = template;\n    const senateLogo = igalaBg;\n\n    /* ── Helper: draw photo covering a rectangular area ── */"

end_str = "    ctx.fillText(\"Powered by HamisNetwork 4 Halims\", W / 2, H - 25);\n}"

start_idx = text.find("    const { accent, secondary, id } = template;")
end_idx = text.find("}", text.find("ctx.fillText(\"Powered by HamisNetwork 4 Halims\"")) + 1

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_body + text[end_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Done")
