const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('page.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src/app/(dashboard)');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove import
    content = content.replace(/import AppShell from ["']@\/components\/layout\/AppShell["'];?\r?\n?/g, '');
    
    // Remove opening tag
    content = content.replace(/<AppShell[^>]*>\r?\n?/g, '');
    
    // Remove closing tag
    content = content.replace(/<\/AppShell>\r?\n?/g, '');
    
    fs.writeFileSync(file, content);
});
console.log('AppShell stripped from ' + files.length + ' files');
