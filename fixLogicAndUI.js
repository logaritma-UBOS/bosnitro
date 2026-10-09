const fs = require('fs');

// 1. Fix API user status
let statusApi = fs.readFileSync('src/app/api/user/status/route.ts', 'utf8');
statusApi = statusApi.replace(
  /const payment = await prisma\.ubosRevenue\.findFirst/g,
  `
    let targetUserId = user.id;
    let targetEmail = user.email;

    if ((session.user as any).staffBusinessId) {
       const business = await prisma.business.findUnique({
          where: { id: (session.user as any).staffBusinessId },
          include: { user: true }
       });
       if (business && business.user) {
          targetUserId = business.user.id;
          targetEmail = business.user.email;
       }
    }

    // Pengecualian Khusus (Permanent VIP / Lifetime)
    const PERMANENT_VIPS = ["warunkarsi23@gmail.com"];
    if (PERMANENT_VIPS.includes(targetEmail)) {
      return NextResponse.json({ 
        isAuthenticated: true, 
        isVIP: true,
        tier: "Lifetime",
        hasPhone: !!user.phone || user.role === "KASIR" || user.role === "MANAGER"
      });
    }

    const payment = await prisma.ubosRevenue.findFirst`
);
// Remove old PERMANENT_VIPS block to avoid duplication
statusApi = statusApi.replace(
  /\/\/ Pengecualian Khusus \(Permanent VIP \/ Lifetime\)[\s\S]*?if \(PERMANENT_VIPS\.includes\(user\.email\)\) \{[\s\S]*?\}\n/,
  ''
);
// Replace user.id with targetUserId in payment query
statusApi = statusApi.replace(
  /where: \{ \s*userId: user\.id, \s*status: "PAID"/g,
  `where: { userId: targetUserId, status: "PAID"`
);
fs.writeFileSync('src/app/api/user/status/route.ts', statusApi);

// 2. Add Logout to DesktopSidebar
let ds = fs.readFileSync('src/components/layout/DesktopSidebar.tsx', 'utf8');
if (!ds.includes('logoutUser')) {
  ds = ds.replace('import Link from "next/link"', 'import Link from "next/link"\nimport { logoutUser } from "@/actions/auth"');
  ds = ds.replace('{/* Footer version */}', `
      {/* LOGOUT */}
      <div className="px-3 mt-auto mb-2">
        <form action={logoutUser}>
          <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Keluar
          </button>
        </form>
      </div>
      {/* Footer version */}`);
  fs.writeFileSync('src/components/layout/DesktopSidebar.tsx', ds);
}

// 3. Improve MobileBottomNav and add Logout
let mb = fs.readFileSync('src/components/layout/MobileBottomNav.tsx', 'utf8');
if (!mb.includes('logoutUser')) {
  mb = mb.replace('import { useState } from "react"', 'import { useState } from "react"\nimport { logoutUser } from "@/actions/auth"');
}
// Improve styles
mb = mb.replace(
  'className="lg:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm border-t border-gray-200 flex justify-around items-center h-[68px] z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe"',
  'className="lg:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200/50 flex justify-around items-center h-[72px] z-[60] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-safe rounded-t-2xl"'
);
// Make Kasir button look better
mb = mb.replace(
  'className="bg-emerald-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-transform active:scale-95 border-4 border-white"',
  'className="bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white w-[60px] h-[60px] rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(16,185,129,0.4)] hover:scale-105 transition-transform active:scale-95 border-[4px] border-white"'
);
mb = mb.replace('<span className="text-[10px] font-bold text-gray-700 mt-1">Kasir</span>', '<span className="text-[11px] font-black text-emerald-600 mt-1.5 tracking-tight">KASIR</span>');

// Add Logout in Menu Lainnya
if (!mb.includes('Keluar (Logout)')) {
  mb = mb.replace(
    '</div>\n            </div>\n          </div>\n        )}',
    `</div>\n              <div className="mt-4 pt-4 border-t border-gray-200 pb-4">\n                <form action={logoutUser} className="w-full">\n                  <button type="submit" className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors">\n                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">\n                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />\n                    </svg>\n                    Keluar (Logout)\n                  </button>\n                </form>\n              </div>\n            </div>\n          </div>\n        )}`
  );
}
fs.writeFileSync('src/components/layout/MobileBottomNav.tsx', mb);

// 4. Remove custom KasirClient bottom nav and adjust sticky cart height
let kc = fs.readFileSync('src/app/(dashboard)/kasir/KasirClient.tsx', 'utf8');
kc = kc.replace(
  /\{\/\* Bottom Navigation \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*$/m,
  '</div>\n    )'
);
kc = kc.replace('bottom-[60px]', 'bottom-[80px]');
kc = kc.replace('bottom-0 left-0 right-0', 'bottom-0 left-0 right-0 pb-[76px]'); // Make the absolute bottom button pad the global nav

// Wait, the mobile bottom button in step 2 (Konfirmasi)
kc = kc.replace(
  '<div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 shadow-lg">',
  '<div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-lg pb-[8px]">'
);

fs.writeFileSync('src/app/(dashboard)/kasir/KasirClient.tsx', kc);

console.log("All UI and logic fixes done!");
