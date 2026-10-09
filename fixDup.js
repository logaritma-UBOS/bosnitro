const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const dup = `<a href="#fitur" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-600 hover:text-emerald-600">Fitur</a>
                <a href="#harga" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-600 hover:text-emerald-600">Harga</a>
              <a href="#harga" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-600 hover:text-emerald-600">Harga</a>`;

const fix = `<a href="#fitur" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-600 hover:text-emerald-600">Fitur</a>
              <a href="#harga" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-600 hover:text-emerald-600">Harga</a>`;

code = code.replace(dup, fix);
fs.writeFileSync('src/components/LandingPage.tsx', code);
