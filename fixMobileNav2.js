const fs = require('fs');
let code = fs.readFileSync('src/components/layout/MobileBottomNav.tsx', 'utf8');

const additionalButton = `
                  <div className="mb-6">
                    <h3 className="text-[10px] font-bold text-gray-400 mb-3 ml-2 tracking-wider uppercase">BANTUAN</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => {
                          setIsMoreOpen(false);
                          setTimeout(() => window.dispatchEvent(new Event('open-live-chat')), 300);
                        }}
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm text-center transition-all"
                      >
                        <span className="text-2xl">💬</span>
                        <span className="text-[10px] font-bold text-gray-700 leading-tight">Support</span>
                      </button>
                    </div>
                  </div>
`;

// Find the line that maps menuCategories
const lines = code.split('\\n');
const idx = lines.findIndex(l => l.includes('{menuCategories.map((category, catIdx) => ('));

if (idx !== -1) {
    lines.splice(idx, 0, additionalButton);
    fs.writeFileSync('src/components/layout/MobileBottomNav.tsx', lines.join('\\n'));
    console.log("Success");
} else {
    console.log("Not found");
}
