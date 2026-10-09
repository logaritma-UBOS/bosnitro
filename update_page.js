const fs = require('fs');

const path = 'src/app/marketing/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const replaceBlock = `<div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-500 hover:text-gray-700">← Kembali</Link>
          <div className="flex-1 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Marketing Engine</h1>
            <Link href="/pengaturan/whatsapp" className="px-4 py-2 bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-sm hover:bg-emerald-200 transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              Integrasi WA
            </Link>
          </div>
        </div>`;

content = content.replace(/<div className="flex items-center gap-3 mb-6">[\s\S]*?<h1 className="text-2xl font-bold text-gray-900">Marketing Engine<\/h1>[\s\S]*?<\/div>/, replaceBlock);

fs.writeFileSync(path, content, 'utf8');