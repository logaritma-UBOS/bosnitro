const fs = require('fs');

const pages = [
    'src/app/admin/pilot/(dashboard)/methodology/checklist/page.tsx',
    'src/app/admin/pilot/(dashboard)/operations/checklist/page.tsx',
    'src/app/admin/pilot/(dashboard)/developer/checklist/page.tsx',
];

const importLine = 'import RadarProspekForm from "@/components/team/RadarProspekForm";';
const checklistImport = 'import ChecklistHarian from "@/components/team/ChecklistHarian";';

const beforeChecklistDiv = '<div className="pt-2 w-full">';
const withRadar = '<RadarProspekForm />\n\n      <div className="pt-2 w-full">';

pages.forEach(p => {
    let c = fs.readFileSync(p, 'utf8');
    // Add import
    if (!c.includes('RadarProspekForm')) {
        c = c.replace(checklistImport, checklistImport + '\n' + importLine);
    }
    // Add component before checklist div
    if (!c.includes('<RadarProspekForm')) {
        c = c.replace(beforeChecklistDiv, withRadar);
    }
    fs.writeFileSync(p, c);
    console.log('Patched:', p);
});
console.log('Done!');
