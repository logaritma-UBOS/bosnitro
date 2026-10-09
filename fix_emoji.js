const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/UbosFeed.tsx', 'utf8');
code = code.replace(/<span className="text-xl">.*?<\/span>/, '<span className="text-xl flex items-center justify-center text-blue-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m17 7-5-5-5 5"/><path d="m17 17-5 5-5-5"/></svg></span>');
fs.writeFileSync('src/components/dashboard/UbosFeed.tsx', code);
console.log("Done");
