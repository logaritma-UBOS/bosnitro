const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

const marketingGrid = `
            <Link href="/marketing" className="bg-white p-4 md:p-6 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm border border-gray-100 min-h-[80px] md:min-h-[100px] hover:bg-gray-50 transition-colors text-center">
              <span className="text-3xl">🚀</span>
              <span className="font-bold text-gray-800 text-xs md:text-sm">Marketing Engine</span>
            </Link>
`;

// Insert after Konten link
const kontenEndIdx = content.indexOf('Konten</span>\n            </Link>') + 'Konten</span>\n            </Link>'.length;
if (kontenEndIdx > 100) {
    content = content.substring(0, kontenEndIdx) + marketingGrid + content.substring(kontenEndIdx);
}

fs.writeFileSync('src/app/page.tsx', content, 'utf8');