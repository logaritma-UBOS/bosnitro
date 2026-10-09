const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pilot/(dashboard)/layout.tsx', 'utf8');

const targetStr = `) : (
            <Link href={\`/admin/pilot/\${teamMember.role.toLowerCase()}\`} className="flex flex-col items-center justify-center w-full h-full text-blue-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="text-[10px] font-bold mt-0.5">Dashboard Saya</span>
            </Link>
          )}`;

const mobileReplace = `) : (
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

if (code.includes(targetStr)) {
    code = code.replace(targetStr, mobileReplace);
    fs.writeFileSync('src/app/admin/pilot/(dashboard)/layout.tsx', code);
    console.log("Successfully replaced mobile layout via exact match!");
} else {
    // If exact match fails due to whitespace, let's use regex
    const regex = /\)\s*:\s*\(\s*<Link href={`\/admin\/pilot\/\${teamMember\.role\.toLowerCase\(\)}`}[\s\S]*?<span className="text-\[10px\] font-bold mt-0\.5">Dashboard Saya<\/span>\s*<\/Link>\s*\)}/;
    if (regex.test(code)) {
        code = code.replace(regex, mobileReplace);
        fs.writeFileSync('src/app/admin/pilot/(dashboard)/layout.tsx', code);
        console.log("Successfully replaced mobile layout via regex!");
    } else {
        console.log("Could not find the mobile dashboard link to replace.");
    }
}
