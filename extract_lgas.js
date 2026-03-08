const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'app', 'data', 'lgas.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Function to find LGA key ignoring case and small differences
function findLGAKey(lgaName) {
    const keys = Object.keys(data);
    const found = keys.find(k => k.toLowerCase().replace(/[^a-z]/g, '') === lgaName.toLowerCase().replace(/[^a-z]/g, ''));
    return found;
}

const lgasToExtract = [
    { name: 'Bassa', file: 'bassaData.ts' },
    { name: 'Dekina', file: 'dekinaData.ts' },
    { name: 'Ibaji', file: 'ibajiData.ts' },
    { name: 'Idah', file: 'idahData.ts' },
    { name: 'Igalamela-Odolu', file: 'igalamelaData.ts' },
    { name: 'Ofu', file: 'ofuData.ts' }
];

lgasToExtract.forEach(lga => {
    const key = findLGAKey(lga.name);
    if (key) {
        const lgaObj = data[key];
        const result = [];
        for (const [wardName, units] of Object.entries(lgaObj)) {
            result.push({
                ward: wardName,
                pollingUnits: units
            });
        }
        const content = `export const ${lga.file.replace('.ts', '')} = ${JSON.stringify(result, null, 2)};\n`;
        fs.writeFileSync(path.join(__dirname, 'app', 'data', lga.file), content);
        console.log(`Successfully extracted ${lga.name} to ${lga.file}`);
    } else {
        console.log(`LGA ${lga.name} not found in lgas.json`);
    }
});
