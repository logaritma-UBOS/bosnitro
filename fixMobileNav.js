const fs = require('fs');
let code = fs.readFileSync('src/components/layout/MobileBottomNav.tsx', 'utf8');

const additionalButton = `
                  <div className="mt-6">
                    <h3 className="text-[10px] font-bold text-gray-400 mb-3 ml-2 tracking-wider uppercase">BANTUAN</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => {
                          setIsMoreOpen(false);
                          window.dispatchEvent(new Event('open-live-chat'));
                        }}
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm text-center transition-all"
                      >
                        <span className="text-2xl">💬</span>
                        <span className="text-[10px] font-bold text-gray-700 leading-tight">Support</span>
                      </button>
                    </div>
                  </div>
`;

// Insert it right after the loop over menuCategories
code = code.replace(
    `                  {menuCategories.map((category, catIdx) => (`,
    additionalButton + `\n                  {menuCategories.map((category, catIdx) => (`
);

fs.writeFileSync('src/components/layout/MobileBottomNav.tsx', code);
console.log("Updated MobileBottomNav");
