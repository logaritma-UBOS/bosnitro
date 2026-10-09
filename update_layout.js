const fs = require('fs');
let code = fs.readFileSync('scratch_layout.tsx', 'utf8');

// The block we want to replace in DESKTOP SIDEBAR:
/*
                ) : (
                  <Link href={`/admin/pilot/${teamMember.role.toLowerCase()}`} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> Dashboard Saya
                  </Link>
                )}
*/
const desktopReplace = `                ) : (
                  <>
                    <Link href={\`/admin/pilot/\${teamMember.role.toLowerCase()}\`} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> Beranda & Profil
                    </Link>
                    <Link href={\`/admin/pilot/\${teamMember.role.toLowerCase()}/checklist\`} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Checklist Harian
                    </Link>
                    <Link href={\`/admin/pilot/\${teamMember.role.toLowerCase()}/tools\`} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> Ruang Kerja (Tools)
                    </Link>
                  </>
                )}`;

code = code.replace(/}\) :\s*\(\s*<Link href={`\/admin\/pilot\/\${teamMember\.role\.toLowerCase\(\)}`} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50">\s*<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth=\{2\}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" \/><\/svg> Dashboard Saya\s*<\/Link>\s*\)}/, desktopReplace);


// The block we want to replace in MOBILE BOTTOM NAVIGATION:
/*
          ) : (
            <Link href={`/admin/pilot/${teamMember.role.toLowerCase()}`} className="flex flex-col items-center justify-center w-full h-full text-blue-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="text-[10px] font-bold mt-0.5">Dashboard Saya</span>
            </Link>
          )}
*/

const mobileReplace = `          ) : (
            <>
              <Link href={\`/admin/pilot/\${teamMember.role.toLowerCase()}\`} className="flex flex-col items-center justify-center w-[25%] h-full text-gray-400 hover:text-blue-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                <span className="text-[10px] font-semibold mt-0.5">Beranda</span>
              </Link>

              <div className="relative w-[25%] flex justify-center -mt-7">
                <Link href={\`/admin/pilot/\${teamMember.role.toLowerCase()}/checklist\`} className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 rounded-full flex flex-col items-center justify-center text-white shadow-xl shadow-emerald-500/30 border-[3px] border-white active:scale-95 transition-all">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </Link>
              </div>

              <Link href={\`/admin/pilot/\${teamMember.role.toLowerCase()}/tools\`} className="flex flex-col items-center justify-center w-[25%] h-full text-gray-400 hover:text-blue-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                <span className="text-[10px] font-semibold mt-0.5">Tools</span>
              </Link>
              
              <Link href="/admin/pilot/menu" className="flex flex-col items-center justify-center w-[25%] h-full text-gray-400 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                <span className="text-[10px] font-semibold mt-0.5">Menu</span>
              </Link>
            </>
          )}`;

code = code.replace(/\) :\s*\(\s*<Link href={`\/admin\/pilot\/\${teamMember\.role\.toLowerCase\(\)}`} className="flex flex-col items-center justify-center w-full h-full text-blue-600">\s*<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth=\{2\}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" \/><\/svg>\s*<span className="text-\[10px\] font-bold mt-0\.5">Dashboard Saya<\/span>\s*<\/Link>\s*\)/, mobileReplace);


fs.writeFileSync('src/app/admin/pilot/(dashboard)/layout.tsx', code);
console.log("Updated layout.tsx");
