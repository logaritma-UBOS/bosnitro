const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Ganti `Rp {xxx.toLocaleString('id-ID')}` dengan `{formatRupiah(xxx)}`
  content = content.replace(/Rp\s*\{([^}]+?)\.toLocaleString\(['"]id-ID['"]\)\}/g, '{formatRupiah($1)}');
  
  // 2. Ganti `Rp ${xxx.toLocaleString('id-ID')}` dengan `${formatRupiah(xxx)}`
  content = content.replace(/Rp\s*\$\{([^}]+?)\.toLocaleString\(['"]id-ID['"]\)\}/g, '${formatRupiah($1)}');

  // 3. Ganti sisanya yang `Rp xxx.toLocaleString('id-ID')` di dalam text
  content = content.replace(/Rp\s*([a-zA-Z0-9_.\(\)\*\s\+\-]+?)\.toLocaleString\(['"]id-ID['"]\)/g, '{formatRupiah($1)}');

  // 4. Ganti sisa `toLocaleString('id-ID')` dengan `formatNumber`
  content = content.replace(/([a-zA-Z0-9_.\(\)\*\s\+\-]+?)\.toLocaleString\(['"]id-ID['"]\)/g, 'formatNumber($1)');

  if (content !== original) {
    const needsFormatNumber = content.includes('formatNumber(');
    const needsFormatRupiah = content.includes('formatRupiah(');
    
    if (needsFormatNumber || needsFormatRupiah) {
      if (!content.includes('import { formatNumber')) {
         const importStmt = "import { formatNumber, formatRupiah } from '@/lib/format';\n";
         if (content.startsWith('"use client"') || content.startsWith("'use client'")) {
            content = content.replace(/["']use client["'];?\n/, `$&${importStmt}`);
         } else if (content.startsWith('"use server"') || content.startsWith("'use server'")) {
            content = content.replace(/["']use server["'];?\n/, `$&${importStmt}`);
         } else {
            content = importStmt + content;
         }
      }
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated: ' + file);
  }
});