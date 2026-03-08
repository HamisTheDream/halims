const fs = require('fs');
const path = require('path');

const replacements = [
    { regex: /Prince Gowon Enenche/g, rep: 'Rt. Hon. Abdullahi Ibrahim Ali' },
    { regex: /PRINCE GOWON ENENCHE/g, rep: 'RT. HON. ABDULLAHI IBRAHIM ALI' },
    { regex: /Prince/g, rep: 'Rt. Hon.' },
    { regex: /PRINCE/g, rep: 'RT. HON.' },
    { regex: /Gowon/g, rep: 'Abdullahi Ibrahim' },
    { regex: /GOWON/g, rep: 'ABDULLAHI IBRAHIM' },
    { regex: /Enenche/g, rep: 'Ali' },
    { regex: /ENENCHE/g, rep: 'ALI' },
    { regex: /G-One/g, rep: 'Halims' },
    { regex: /G-ONE/g, rep: 'HALIMS' },
    { regex: /g-one/g, rep: 'halims' },
    { regex: /SDP/g, rep: 'APC' },
    { regex: /Sdp/g, rep: 'Apc' },
    { regex: /sdp/g, rep: 'apc' },
    { regex: /Social Democratic Party/g, rep: 'All Progressives Congress' },
    { regex: /SOCIAL DEMOCRATIC PARTY/g, rep: 'ALL PROGRESSIVES CONGRESS' },
    { regex: /Chief Iduh/gi, rep: 'Supporter' },
    { regex: /ankpa_omala_olamaboro\.json/g, rep: 'kogi_east.json' }
];

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git' && file !== 'public' && file !== 'data') { // skipping data folder for now
                filelist = walkSync(filePath, filelist);
            }
        } else {
            if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css') || filePath.endsWith('.json') || filePath.endsWith('.md')) {
                filelist.push(filePath);
            }
        }
    });
    return filelist;
}

const files = walkSync(path.join(__dirname, 'app'));
// include data folder later, but wait, data files are named ankpaData.ts etc. We'll rename them later if necessary, but we can replace their content.
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    let original = content;
    replacements.forEach(r => {
        content = content.replace(r.regex, r.rep);
    });
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf-8');
        console.log('Modified:', file);
    }
});

['package.json', 'README.md'].forEach(file => {
    let f = path.join(__dirname, file);
    if (fs.existsSync(f)) {
        let content = fs.readFileSync(f, 'utf-8');
        let original = content;
        replacements.forEach(r => {
            content = content.replace(r.regex, r.rep);
        });
        if (content !== original) {
            fs.writeFileSync(f, content, 'utf-8');
        }
    }
});
