const fs = require('fs');
let content = fs.readFileSync('src/app/login/page.tsx', 'utf8');

// Add state
content = content.replace(
  'const [showPassword, setShowPassword] = useState(false)',
  'const [showPassword, setShowPassword] = useState(false)\n  const [googleLoading, setGoogleLoading] = useState(false)'
);

// Replace button
const oldButton = `<button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/beranda" })}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
          >`;

const newButton = `<button
            type="button"
            disabled={googleLoading}
            onClick={() => {
              setGoogleLoading(true);
              signIn("google", { callbackUrl: "/beranda" });
            }}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >`;

content = content.replace(oldButton, newButton);

// Add loading text
content = content.replace('<span>Google</span>', '{googleLoading ? <span>Memuat...</span> : <span>Google</span>}');

fs.writeFileSync('src/app/login/page.tsx', content);
