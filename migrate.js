const fs = require('fs');
const path = require('path');

const replacements = [
    [/Chief Pharmacist Yakubu Peter Iduh/g, 'Prince Gowon Enenche (G-One)'],
    [/Chief Pharm\. Yakubu Peter Iduh/g, 'Prince Gowon Enenche (G-One)'],
    [/Chief Pharm\. Y\.P\. Iduh/g, 'Prince Gowon Enenche'],
    [/Chief Pharm\. Iduh/g, 'Prince Gowon Enenche'],
    [/Chief Iduh/gi, 'Prince Gowon Enenche'],
    [/African Democratic Congress/g, 'Social Democratic Party'],
    [/\bADC\b/g, 'SDP'],
    [/\badc-logo\.png\b/g, 'sdp-logo-1.png'],
    [/\bchief-iduh\.png\b/g, 'g-one-2.png'],
    [/\bchief-iduh-2\.png\b/g, 'g-one-3.png'],
    [/\bchief-iduh-3\.png\b/g, 'g-one-4.png'],
    [/Idah Federal Constituency/g, 'Ankpa Federal Constituency'],
    [/Idah\/Igalamela-Odolu\/Ibaji\/Ofu/g, 'Ankpa/Omala/Olamaboro'],
    [/Idah, Igalamela-Odolu, Ibaji, and Ofu/g, 'Ankpa, Omala, and Olamaboro'],
    [/Idah, Igalamela-Odolu, Ibaji/g, 'Ankpa, Omala'],
    [/iduhcampaign\.org\.ng/g, 'localhost:3000'],
    [/\biduhPhoto\b/g, 'gOnePhoto'],
    [/\bIduhPhoto\b/g, 'GOnePhoto'],
    [/\biduh\b/g, 'g-one'],
    [/\bIduh\b/g, 'G-One']
];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git') && !file.includes('images')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css') || file.endsWith('.json') || file.endsWith('.sql') || file.endsWith('.md')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('c:/xampp/htdocs/g-one');
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    replacements.forEach(([regex, replacement]) => {
        content = content.replace(regex, replacement);
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Migration text replacement complete. Modified ${changedFiles} files.`);
