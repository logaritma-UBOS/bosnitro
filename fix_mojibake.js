const fs = require("fs");
const path = "src/app/pengaturan/whatsapp/WaSettingsClient.tsx";
let content = fs.readFileSync(path, "utf8");

// Replace any weird characters inside the step 5 bubble with an SVG checkmark
// We'll just look for the div containing the weird character.
// The structure is: <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">[WEIRD CHAR]</div>

content = content.replace(/<div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">[^<]+<\/div>/g, 
  `<div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  </div>`
);

fs.writeFileSync(path, content, "utf8");
console.log("Fixed!");