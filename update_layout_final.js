const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pilot/(dashboard)/layout.tsx', 'utf8');

// Replace desktop menu
const desktopRegex = /}\) :\s*\(\s*<Link href={`\/admin\/pilot\/\${teamMember\.role\.toLowerCase\(\)}`}[\s\S]*?<span className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-gray-500 font-bold">\s*\{session\?.user\?.name\?\.charAt\(0\)\}\s*<\/span>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/aside>/;

// Wait, the desktop regex should just target the single Link for non-superadmin:
const desktopTarget = `                ) : (
                  <Link href={\`/admin/pilot/\${teamMember.role.toLowerCase()}\`} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> Dashboard Saya
                  </Link>
                )}`;

const desktopReplacement = `                ) : (
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

code = code.replace(desktopTarget, desktopReplacement);

const mobileTarget = `          ) : (
            <Link href={\`/admin/pilot/\${teamMember.role.toLowerCase()}\`} className="flex flex-col items-center justify-center w-full h-full text-blue-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="text-[10px] font-bold mt-0.5">Dashboard Saya</span>
            </Link>
          )}`;

const mobileReplacement = `          ) : (
            <>
              <Link href={\`/admin/pilot/\${teamMember.role.toLowerCase()}\`} className="flex flex-col items-center justify-center w-[33%] h-full text-gray-400 hover:text-blue-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                <span className="text-[10px] font-semibold mt-0.5">Beranda</span>
              </Link>
              <Link href={\`/admin/pilot/\${teamMember.role.toLowerCase()}/checklist\`} className="flex flex-col items-center justify-center w-[33%] h-full text-gray-400 hover:text-blue-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-[10px] font-semibold mt-0.5">Checklist</span>
              </Link>
              <Link href={\`/admin/pilot/\${teamMember.role.toLowerCase()}/tools\`} className="flex flex-col items-center justify-center w-[33%] h-full text-gray-400 hover:text-blue-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                <span className="text-[10px] font-semibold mt-0.5">Tools</span>
              </Link>
            </>
          )}`;

code = code.replace(mobileTarget, mobileReplacement);

fs.writeFileSync('src/app/admin/pilot/(dashboard)/layout.tsx', code);
console.log("Success.");
