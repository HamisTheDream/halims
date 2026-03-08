const fs = require('fs');

const files = [
    'c:/xampp/htdocs/halims/app/admin/situation-room/page.tsx',
    'c:/xampp/htdocs/halims/app/agent/ward/page.tsx',
    'c:/xampp/htdocs/halims/app/agent/pu/page.tsx'
];

files.forEach(f => {
    let raw = fs.readFileSync(f, 'utf8');
    
    // Generic
    let content = raw.replace(/apc_score: number;\r?\n(\s*)apc_score: number;/g, 'sdp_score: number;\n$1apc_score: number;');
    content = content.replace(/apc_score: 0, apc_score: 0/g, 'sdp_score: 0, apc_score: 0');
    content = content.replace(/apc: 0, apc: 0/g, 'sdp: 0, apc: 0');
    
    content = content.replace(/form\.apc_score \+ form\.apc_score/g, 'form.sdp_score + form.apc_score');
    content = content.replace(/form\.apc \+ form\.apc/g, 'form.sdp + form.apc');
    
    // Situation Room specific
    content = content.replace(/apc_score: form\.apc_score,\r?\n(\s*)apc_score: form\.apc_score,/g, 'sdp_score: form.sdp_score,\n$1apc_score: form.apc_score,');
    content = content.replace(/apc_score: form\.apc,\r?\n(\s*)apc_score: form\.apc,/g, 'sdp_score: form.sdp,\n$1apc_score: form.apc,');
    
    content = content.replace(/apc: filtered\.reduce\(\(s, r\) => s \+ r\.apc_score, 0\),\r?\n(\s*)apc: filtered\.reduce\(\(s, r\) => s \+ r\.apc_score, 0\),/g, 'sdp: filtered.reduce((s, r) => s + r.sdp_score, 0),\n$1apc: filtered.reduce((s, r) => s + r.apc_score, 0),');
    content = content.replace(/apc: results\.reduce\(\(s, r\) => s \+ r\.apc_score, 0\),\r?\n(\s*)apc: results\.reduce\(\(s, r\) => s \+ r\.apc_score, 0\),/g, 'sdp: results.reduce((s, r) => s + r.sdp_score, 0),\n$1apc: results.reduce((s, r) => s + r.apc_score, 0),');
    
    content = content.replace(/apc: number; apc: number;/g, 'sdp: number; apc: number;');
    content = content.replace(/Math\.max\(wc\.apc, wc\.apc/g, 'Math.max(wc.sdp, wc.apc');
    
    content = content.replace(/\{ key: "apc", label: "APC", color: "#1D7A50", score: collation\.apc \},\r?\n(\s*)\{ key: "apc", label: "APC", color: "#0066B3", score: collation\.apc \}/g, '{ key: "sdp", label: "SDP", color: "#1D7A50", score: collation.sdp },\n$1{ key: "apc", label: "APC", color: "#0066B3", score: collation.apc }');
    
    content = content.replace(/\{ label: "APC Score", key: "apc_score" as const, color: "#1D7A50" \},\r?\n(\s*)\{ label: "APC Score", key: "apc_score" as const, color: "#0066B3" \}/g, '{ label: "SDP Score", key: "sdp_score" as const, color: "#1D7A50" },\n$1{ label: "APC Score", key: "apc_score" as const, color: "#0066B3" }');
    
    content = content.replace(/\{ label: "APC", key: "apc" as const, color: "#1D7A50" \},\r?\n(\s*)\{ label: "APC", key: "apc" as const, color: "#0066B3" \}/g, '{ label: "SDP", key: "sdp" as const, color: "#1D7A50" },\n$1{ label: "APC", key: "apc" as const, color: "#0066B3" }');
    
    content = content.replace(/wc\.apc \+= r\.apc_score;\r?\n(\s*)wc\.apc \+= r\.apc_score;/g, 'wc.sdp += r.sdp_score;\n$1wc.apc += r.apc_score;');
    
    content = content.replace(/"APC", "APC"/g, '"SDP", "APC"');
    
    // JSX spans
    content = content.replace(/<span style={{ color: "#1D7A50", fontWeight: 700 }}>APC: \{r\.apc_score\}<\/span>\r?\n(\s*)<span style={{ color: "#0066B3", fontWeight: 700 }}>APC: \{r\.apc_score\}<\/span>/g, '<span style={{ color: "#1D7A50", fontWeight: 700 }}>SDP: {r.sdp_score}</span>\n$1<span style={{ color: "#0066B3", fontWeight: 700 }}>APC: {r.apc_score}</span>');
    
    content = content.replace(/<span style={{ color: "#1D7A50" }}>APC:\{r\.apc_score\}<\/span>\r?\n(\s*)<span style={{ color: "#0066B3" }}>APC:\{r\.apc_score\}<\/span>/g, '<span style={{ color: "#1D7A50" }}>SDP:{r.sdp_score}</span>\n$1<span style={{ color: "#0066B3" }}>APC:{r.apc_score}</span>');
    
    // td replaces
    // <td style={{ padding: "8px", textAlign: "center", fontWeight: wc.apc === leading ? 900 : 400, color: wc.apc === leading ? "#1D7A50" : "var(--admin-text)" }}>{wc.apc}</td>
    content = content.replace(/<td style={{ padding: "8px", textAlign: "center", fontWeight: wc\.apc === leading \? 900 : 400, color: wc\.apc === leading \? "#1D7A50" : "var\(--admin-text\)" }}>\{wc\.apc\}<\/td>\r?\n(\s*)<td style={{ padding: "8px", textAlign: "center", fontWeight: wc\.apc === leading \? 900 : 400, color: wc\.apc === leading \? "#0066B3" : "var\(--admin-text\)" }}>\{wc\.apc\}<\/td>/g, '<td style={{ padding: "8px", textAlign: "center", fontWeight: wc.sdp === leading ? 900 : 400, color: wc.sdp === leading ? "#1D7A50" : "var(--admin-text)" }}>{wc.sdp}</td>\n$1<td style={{ padding: "8px", textAlign: "center", fontWeight: wc.apc === leading ? 900 : 400, color: wc.apc === leading ? "#0066B3" : "var(--admin-text)" }}>{wc.apc}</td>');

    // PU page existing fetch check
    content = content.replace(/apc: result\.apc_score,\r?\n(\s*)apc: result\.apc_score,/g, 'sdp: result.sdp_score,\n$1apc: result.apc_score,');
    
    
    if (content !== raw) {
        fs.writeFileSync(f, content, 'utf8');
        console.log("Fixed", f);
    } else {
        console.log("No changes for", f);
    }
});
