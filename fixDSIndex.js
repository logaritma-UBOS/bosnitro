const fs = require('fs');
let ds = fs.readFileSync('src/components/layout/DesktopSidebar.tsx', 'utf8');

const injection = `
        { label: "Pegawai", href: "/pengaturan/pegawai", icon: (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        ) },`;

if (!ds.includes('href: "/pengaturan/pegawai"')) {
    const searchStr = 'href: "/pengeluaran"';
    const idx = ds.indexOf(searchStr);
    if (idx !== -1) {
        // Find the next `) },` after this
        const endIdx = ds.indexOf(') },', idx);
        if (endIdx !== -1) {
            const insertIdx = endIdx + 4; // after `) },`
            ds = ds.slice(0, insertIdx) + injection + ds.slice(insertIdx);
            fs.writeFileSync('src/components/layout/DesktopSidebar.tsx', ds);
            console.log('Successfully injected!');
        } else {
            console.log('Could not find end of Pengeluaran');
        }
    } else {
        console.log('Could not find Pengeluaran');
    }
} else {
    console.log('Pegawai already injected');
}
