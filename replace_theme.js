const fs = require('fs');
const path = require('path');

const replacements = [
    // Image replacements
    { regex: /\/images\/halims-1\.png/g, rep: '/images/halims1.png' },
    { regex: /\/images\/halims-2\.png/g, rep: '/images/halims2.png' },
    { regex: /\/images\/halims-3\.png/g, rep: '/images/halims3.png' },
    { regex: /\/images\/apc-logo-1\.png/g, rep: '/images/apc-logo.png' },

    // Theme palette mappings
    // 004D25 -> 002D62 (Deep Blue)
    { regex: /#004D25/gi, rep: '#002D62' },
    { regex: /var\(--green-deep\)/g, rep: 'var(--blue-deep)' },
    { regex: /--green-deep:/g, rep: '--blue-deep:' },

    // 007A3D -> 0047AB (Vibrant Blue)
    { regex: /#007A3D/gi, rep: '#0047AB' },
    { regex: /var\(--green-mid\)/g, rep: 'var(--blue-mid)' },
    { regex: /--green-mid:/g, rep: '--blue-mid:' },

    // 00B159 -> 0066B3 (APC Lighter Blue)
    { regex: /#00B159/gi, rep: '#0066B3' },
    { regex: /var\(--green-light\)/g, rep: 'var(--blue-light)' },
    { regex: /--green-light:/g, rep: '--blue-light:' },

    // D32F2F (old gold) -> E3000F (APC Red)
    { regex: /#D32F2F/gi, rep: '#E3000F' },
    { regex: /var\(--gold\)/g, rep: 'var(--apc-red)' },
    { regex: /--gold:/g, rep: '--apc-red:' },

    // E53935 (old gold light) -> FF1E27
    { regex: /#E53935/gi, rep: '#FF1E27' },
    { regex: /var\(--gold-light\)/g, rep: 'var(--apc-red-light)' },
    { regex: /--gold-light:/g, rep: '--apc-red-light:' },

    // FFCDD2 (old gold pale) -> FFD1D3
    { regex: /#FFCDD2/gi, rep: '#FFD1D3' },
    { regex: /var\(--gold-pale\)/g, rep: 'var(--apc-red-pale)' },
    { regex: /--gold-pale:/g, rep: '--apc-red-pale:' },

    // Add APC Green variable as a new addition wherever red/blue needs complementing
    // We'll manually insert this into globals.css later, but for now just rename the root name
    { regex: /IGALA ROYAL PALETTE/g, rep: 'APC PREMIUM PALETTE' },
];

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git' && file !== 'public') {
                filelist = walkSync(filePath, filelist);
            }
        } else {
            if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
                filelist.push(filePath);
            }
        }
    });
    return filelist;
}

const files = walkSync(path.join(__dirname, 'app'));

let changedFiles = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    let original = content;
    replacements.forEach(r => {
        content = content.replace(r.regex, r.rep);
    });
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf-8');
        console.log('Modified:', file);
        changedFiles++;
    }
});

console.log(`Total files modified: ${changedFiles}`);
