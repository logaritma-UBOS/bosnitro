const fs = require('fs');
let code = fs.readFileSync('src/components/layout/MobileBottomNav.tsx', 'utf8');

const additionalButton = `
                  <div className="mt-6">
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

// Replace `</div>\n                </div>\n              </div>\n              <div className="mt-4 pt-4 border-t border-gray-200 pb-4">`
const target = `                  </div>\n                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 pb-4">`;

if (code.includes('              </div>\n              <div className="mt-4 pt-4 border-t border-gray-200 pb-4">')) {
    code = code.replace('              </div>\n              <div className="mt-4 pt-4 border-t border-gray-200 pb-4">', additionalButton + '\n              </div>\n              <div className="mt-4 pt-4 border-t border-gray-200 pb-4">');
    fs.writeFileSync('src/components/layout/MobileBottomNav.tsx', code);
    console.log("Success exact match 1");
} else {
    // just use replace using a more relaxed regex
    code = code.replace(/<\/div>\s*<\/div>\s*\)\)}\s*<\/div>\s*<div className="mt-4 pt-4 border-t border-gray-200 pb-4">/s, additionalButton + '\n                </div>\n              ))}</div>\n              <div className="mt-4 pt-4 border-t border-gray-200 pb-4">');
    fs.writeFileSync('src/components/layout/MobileBottomNav.tsx', code);
    console.log("Success regex match");
}
