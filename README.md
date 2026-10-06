# Alkahfi Logaritma - UBOS (Ultimate Business Operating System)

Aplikasi website manajemen bisnis terpadu untuk UMKM dan ritel modern berbasis **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS 4**, **Prisma ORM**, dan **Supabase**.

---

## 🚀 Fitur Utama

1. **Kasir / Point of Sale (POS):**
   - Transaksi kasir cepat, pencarian barcode & nama menu
   - Metode pembayaran lengkap (Tunai, QRIS, Transfer Bank)
   - Cetak struk belanja otomatis & riwayat transaksi real-time
2. **Katalog Produk & Resep HPP:**
   - Manajemen produk, kategori, dan varian harga
   - Kalkulator HPP (Harga Pokok Penjualan) & margin keuntungan berbasis komposisi resep bahan baku
3. **Manajemen Stok & Gudang:**
   - Pencatatan stok masuk, stok keluar, opname, dan peringatan batas minimum stok
   - Pengurangan stok bahan baku otomatis setiap transaksi penjualan
4. **Toko Online Terintegrasi:**
   - Katalog online publik untuk setiap tenant (`/toko/[slug]`)
   - Pesanan online langsung terhubung ke kasir
5. **Keuangan & Laporan Bisnis:**
   - Laporan laba/rugi, omzet harian/bulanan, pengeluaran & pemasukan operasional
   - Ekspor laporan dan ringkasan audit finansial
6. **Marketing Engine & WhatsApp Blast:**
   - Kupon diskon, promosi bertarget, dan kalender konten
   - Integrasi WhatsApp Blast otomatis melalui API Fonnte
7. **Analisis Bisnis Cerdas:**
   - Analisis jam ramai (sales time heat map), basket size (AOV), dan performa produk
8. **Keamanan & Otorisasi Multi-Role:**
   - Autentikasi modern via NextAuth v5 (Google OAuth & Kredensial)
   - Pembagian hak akses terisolasi untuk Owner, Manager, dan Kasir

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **UI Library:** [React 19](https://react.dev/) & [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons & Animation:** Lucide Icons, Framer Motion
- **ORM & Database:** [Prisma ORM](https://www.prisma.io/) (SQLite / LibSQL)
- **Backend & Cloud Database:** [Supabase](https://supabase.com/)
- **Autentikasi:** [NextAuth.js v5](https://authjs.dev/)
- **Payment Gateway:** Mayar Integration

---

## ⚙️ Konfigurasi Environment (`.env`)

Buat berkas `.env` atau `.env.local` di root proyek:

```env
# Database Prisma
DATABASE_URL="file:./dev.db"

# NextAuth Secret
AUTH_SECRET="your_random_secret_key_here"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://dwkgqhkjegbublkuhgbg.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_Xw_Jm0gESzUxL3R3sI9QCA_VXIxHZRN"
```

---

## 📦 Panduan Instalasi & Menjalankan di Localhost

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Generate Database Client:**
   ```bash
   npx prisma generate
   ```

3. **Sinkronisasi Database Lokal (SQLite):**
   ```bash
   npx prisma db push
   ```

4. **Jalankan Server Development:**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

5. **Build untuk Produksi:**
   ```bash
   npm run build
   npm run start
   ```

---

## 📁 Struktur Direktori

```
├── prisma/
│   └── schema.prisma         # Definisi model database Prisma
├── public/                   # Aset gambar, ikon, dan logo publik
├── src/
│   ├── actions/              # Server Actions (POS, katalog, stok, auth, dll.)
│   ├── app/                  # Rute Next.js App Router
│   │   ├── (dashboard)/      # Halaman dashboard tenant (beranda, kasir, katalog, stok, dll.)
│   │   ├── api/              # API Route handlers (auth, cron, webhooks)
│   │   ├── toko/             # Halaman toko online publik
│   │   ├── login/            # Halaman login
│   │   └── page.tsx          # Landing page utama
│   ├── components/           # Komponen UI, layout, dan widget
│   ├── lib/                  # Helper utilities, Prisma client, Supabase client
│   └── types/                # Definisi TypeScript
├── .github/
│   └── workflows/ci.yml      # CI Automated Workflow GitHub Actions
├── .env.example              # Template variabel lingkungan
└── package.json
```
