const fs = require('fs');

// 1. Fix DesktopSidebar
let ds = fs.readFileSync('src/components/layout/DesktopSidebar.tsx', 'utf8');
if (!ds.includes('{ label: "Pegawai"')) {
  ds = ds.replace(
    /\{\s*label:\s*"Pengeluaran",\s*href:\s*"\/pengeluaran"[\s\S]*?\}\s*\},/g,
    `{ label: "Pengeluaran", href: "/pengeluaran", icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ) },
      { label: "Pegawai", href: "/pengaturan/pegawai", icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ) },`
  );
  fs.writeFileSync('src/components/layout/DesktopSidebar.tsx', ds);
}

// 2. Fix PegawaiClient.tsx
let pc = fs.readFileSync('src/app/(dashboard)/pengaturan/pegawai/PegawaiClient.tsx', 'utf8');

// Fix flex layout for header
pc = pc.replace(
  'className="flex justify-between items-center mb-8"',
  'className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"'
);
// Fix button to not stretch and look good on mobile
pc = pc.replace(
  'className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"',
  'className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm"'
);

// Add overflow-x-auto to table container
pc = pc.replace(
  'className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"',
  'className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto"'
);
// Make table min-width so it scrolls instead of squishing
pc = pc.replace(
  '<table className="w-full text-left text-sm text-slate-600">',
  '<table className="w-full text-left text-sm text-slate-600 min-w-[600px]">'
);
fs.writeFileSync('src/app/(dashboard)/pengaturan/pegawai/PegawaiClient.tsx', pc);

console.log('Fixed UI');
