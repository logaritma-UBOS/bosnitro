const fs = require('fs');
let file = fs.readFileSync('C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/actions/auth.ts', 'utf8');
const searchString = " + "countryCode: \"62\"" + @";
file = file.replace(/const message = Halo [\s\S]*?Tim UBOS;/g, 'const message = Halo **! \\uD83C\\uDF89\\n\\nSelamat datang dan terima kasih sudah mendaftar di *UBOS* (Universal Business Operating System).\\n\\nBerikut adalah detail akun pendaftaran Anda:\\n\\uD83D\\uDC64 Nama: \\n\\uD83D\\uDCE7 Email: \\n\\uD83D\\uDCBC Paket Saat Ini: **\\n\\uD83D\\uDCF1 Kontak: \\n\\nKami siap mendampingi perjalanan bisnis digital Anda. Jika ada pertanyaan, jangan ragu untuk membalas pesan ini!\\n\\nSalam sukses,\\nTim UBOS;');
fs.writeFileSync('C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/actions/auth.ts', file, 'utf8');
console.log('Fixed');
