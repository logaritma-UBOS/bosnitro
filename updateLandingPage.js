const fs = require('fs');
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// 1. Navbar Updates
content = content.replace(
  /<a href="#masalah"(.*?)>Masalah<\/a>\s*<a href="#cara-kerja"(.*?)>Cara Kerja<\/a>\s*<a href="#fitur"(.*?)>Fitur<\/a>/g,
  '<a href="#masalah"$1>Masalah</a>\n              <a href="#cara-kerja"$2>Cara Kerja</a>\n              <a href="#fitur"$3>Fitur</a>\n              <a href="#harga"$3>Harga</a>'
);
content = content.replace(
  /Mulai Gratis/g,
  'Ambil Promo Founder'
);

content = content.replace(
  /<a href="#fitur" onClick=\{\(\) => setIsMobileMenuOpen\(false\)\} className="text-base font-semibold text-slate-600 hover:text-emerald-600">Fitur<\/a>/g,
  '<a href="#fitur" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-600 hover:text-emerald-600">Fitur</a>\n                <a href="#harga" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-600 hover:text-emerald-600">Harga</a>'
);

// 3. Live Proof
const liveProofOriginal = `<div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Kondisi Bisnis Hari Ini</p>
                  <p className="text-3xl font-black text-slate-900 mb-2">Rp 1.450.000</p>
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                    <div className="bg-blue-500 h-2 rounded-full w-[65%]"></div>
                  </div>
                  <p className="text-xs font-semibold text-blue-600">65% dari target tercapai</p>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">🔥 Prioritas Tindakan</p>
                  <p className="text-lg font-bold text-slate-900 mb-1 leading-snug">Buat Promo Diskon Spesial Sore</p>
                  <p className="text-sm text-slate-600">Lalu lintas pengunjung sedang turun. Berikan diskon untuk dorong penjualan.</p>
                </div>
              </div>`;

const liveProofReplacement = `<div className="mt-12">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                  <div className="aspect-[16/9] relative bg-slate-100 flex items-center justify-center">
                    <img src="/screenshot-warsi.png" alt="Dashboard Warunk Arsi" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }} />
                    <div className="absolute inset-0 bg-slate-800/10 hidden items-center justify-center text-slate-500 font-medium text-sm">
                      [Tangkapan Layar Dashboard Warunk Arsi]
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-50/50 border-t border-emerald-100">
                    <p className="text-sm font-medium text-emerald-800 text-center flex flex-col sm:flex-row items-center justify-center gap-2">
                      <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      <span>Sistem ini bukan teori. Telah diuji dan dipakai langsung setiap pagi untuk mengelola operasional, stok bahan baku, dan lonjakan transaksi di Warunk Arsi.</span>
                    </p>
                  </div>
                </div>
              </div>`;

content = content.replace(liveProofOriginal, liveProofReplacement);


// 4. Feature Card
const featureOriginal = `<div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 border border-orange-100">
                <IconHistory className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Kontrol Stok & Inventaris</h3>
              <p className="text-slate-600 leading-relaxed">Otomatis potong stok bahan saat produk terjual. Dapatkan peringatan saat barang mulai menipis sebelum kehabisan.</p>
            </div>
          </div>`;

const featureReplacement = `<div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 border border-orange-100">
                <IconHistory className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Kontrol Stok & Inventaris</h3>
              <p className="text-slate-600 leading-relaxed">Otomatis potong stok bahan saat produk terjual. Dapatkan peringatan saat barang mulai menipis sebelum kehabisan.</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 border border-rose-100">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Marketing & Content Engine (Mesin Penjualan)</h3>
              <p className="text-slate-600 leading-relaxed">Ubah konten media sosial menjadi pesanan nyata dan repeat order lewat alur WhatsApp terintegrasi. Bukan cuma mencatat kasir saat ada pembeli, tapi bantu mendatangkan pembeli ke warung Anda.</p>
            </div>
          </div>`;

content = content.replace(featureOriginal, featureReplacement);


// 2. Pricing Section
const pricingSection = `
      {/* SECTION 4.5: HARGA */}
      <section id="harga" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 [background:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Pilihan Paket Investasi</h2>
            <p className="text-lg text-slate-400">Sistem kasir cerdas yang dirancang untuk membantu Anda menghemat waktu dan meningkatkan omzet.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 flex flex-col relative">
              <h3 className="text-2xl font-bold mb-2">Paket Starter</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-black">Gratis</span>
                <span className="text-slate-400">/ Rp0</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  <span className="text-slate-300">Kasir POS dasar</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  <span className="text-slate-300">Maksimal 15 katalog menu</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  <span className="text-slate-300">Kontrol stok dasar</span>
                </li>
              </ul>
              <Link href="/register" className="w-full py-4 rounded-xl font-bold text-center bg-slate-700 text-white hover:bg-slate-600 transition-colors">
                Coba Gratis Sekarang
              </Link>
            </div>
            
            {/* Founder Pass */}
            <div className="bg-gradient-to-b from-emerald-600 to-emerald-900 rounded-3xl p-8 border border-emerald-500 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-emerald-900/50 mt-8 md:mt-0">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-amber-950 font-black px-4 py-1.5 rounded-full text-sm shadow-lg whitespace-nowrap">
                🔥 Khusus 100 Pemilik Usaha Pertama
              </div>
              <h3 className="text-2xl font-bold mb-2">Paket Founder Pass</h3>
              <p className="text-emerald-200 text-sm mb-4 font-medium uppercase tracking-wide">Terlaris</p>
              <div className="flex flex-col mb-6">
                <span className="text-4xl font-black">Rp399.000</span>
                <span className="text-emerald-200 text-sm mt-1">Sekali bayar seumur hidup, tanpa biaya langganan lagi</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  <span className="text-white">Akses Semua Modul Tanpa Batas (Unlimited Menu & Transaksi)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  <span className="text-white">Modul Marketing Engine & Template Konten Traffic</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  <span className="text-white">Integrasi WhatsApp Struk & Database Pelanggan Tanpa Batas</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  <span className="text-white">Rekomendasi AI Harian (Tutup Gap Omzet Otomatis)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  <span className="text-white">Free Update Fitur Baru UBOS</span>
                </li>
              </ul>
              <Link href="/register?plan=founder" className="w-full py-4 rounded-xl font-bold text-center bg-white text-emerald-900 hover:bg-emerald-50 transition-colors shadow-lg">
                Kunci Akses Founder Sekarang
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: FAQ & FINAL CTA */}
`;

content = content.replace('{/* SECTION 5: FAQ & FINAL CTA */}', pricingSection);

fs.writeFileSync('src/components/LandingPage.tsx', content);
