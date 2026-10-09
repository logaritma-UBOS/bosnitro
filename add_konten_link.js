const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

const kontenGrid = `
            <Link href="/konten" className="bg-white p-4 md:p-6 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm border border-gray-100 min-h-[80px] md:min-h-[100px] hover:bg-gray-50 transition-colors text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
              <span className="text-sm md:text-base font-bold text-gray-800 leading-tight">Konten</span>
            </Link>
`;

const promoGridEnd = `              </Link>`;

const kontenNav = `
          <Link href="/konten" className="flex flex-col items-center text-gray-400 min-w-[56px] md:min-w-[72px] py-1 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 md:w-7 md:h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
            <span className="text-[10px] md:text-xs font-semibold mt-1">Konten</span>
          </Link>
`;

// Insert into Grid
const gridSplit = content.split('href="/promo"');
if (gridSplit.length > 2) {
    // 1st is grid, 2nd is bottom nav
    const promoEndIdx = gridSplit[1].indexOf('</Link>') + 7;
    gridSplit[1] = gridSplit[1].substring(0, promoEndIdx) + kontenGrid + gridSplit[1].substring(promoEndIdx);
    
    const promoNavEndIdx = gridSplit[2].indexOf('</Link>') + 7;
    gridSplit[2] = gridSplit[2].substring(0, promoNavEndIdx) + kontenNav + gridSplit[2].substring(promoNavEndIdx);
    
    content = gridSplit.join('href="/promo"');
    fs.writeFileSync('src/app/page.tsx', content, 'utf8');
}