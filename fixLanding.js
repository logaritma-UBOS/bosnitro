const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Fix duplicate Harga
code = code.replace(
  /<a href="#harga" onClick=\{\(\) => setIsMobileMenuOpen\(false\)\} className="text-base font-semibold text-slate-600 hover:text-emerald-600">Harga<\/a>\n                <a href="#harga" onClick=\{\(\) => setIsMobileMenuOpen\(false\)\} className="text-base font-semibold text-slate-600 hover:text-emerald-600">Harga<\/a>/g,
  '<a href="#harga" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-600 hover:text-emerald-600">Harga</a>'
);

// Fix strikethrough price
code = code.replace(
  /<span className="text-4xl font-black">Rp399\.000<\/span>/,
  '<span className="text-xl text-emerald-300/70 line-through font-medium">Rp1.500.000</span>\n                <span className="text-4xl font-black">Rp399.000</span>'
);

// Redirect to /founder instead of /register?plan=founder
code = code.replace(/href="\/register\?plan=founder"/g, 'href="/founder"');
code = code.replace(/href="\/register" className="inline-flex items-center justify-center/g, 'href="/founder" className="inline-flex items-center justify-center');
fs.writeFileSync('src/components/LandingPage.tsx', code);
