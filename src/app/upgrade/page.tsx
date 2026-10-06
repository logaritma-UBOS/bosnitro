"use client"
import Link from "next/link"
import { useState } from "react"

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpgrade = async (amount: number, planName: string) => {
    setLoading(planName)
    try {
      const res = await fetch("/api/mayar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          planName: `UBOS ${planName}`,
          planDesc: `Akses fitur ${planName} UBOS`
        })
      })
      const data = await res.json()
      if (data.link) {
        window.location.href = data.link
      } else {
        alert(data.error || "Terjadi kesalahan saat memproses pembayaran")
      }
    } catch (e) {
      alert("Gagal menghubungi server")
    } finally {
      setLoading(null)
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Upgrade ke UBOS Pro</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Tingkatkan performa bisnis UMKM Anda dengan fitur tak terbatas. Pilih paket yang sesuai dengan kebutuhan Anda.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* STARTER */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm opacity-80 relative overflow-hidden flex flex-col">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Starter (Gratis Selamanya)</h3>
            <p className="text-sm text-gray-500 mb-6 min-h-10">Sangat cukup untuk warung pemula.</p>
            <div className="mb-6">
              <span className="text-4xl font-black text-gray-900">Rp0</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm text-gray-600 flex-1">
              <li className="flex gap-2 items-start"><span className="text-emerald-500">✓</span> Kasir POS dasar</li>
              <li className="flex gap-2 items-start"><span className="text-emerald-500">✓</span> Maksimal 15 katalog produk</li>
              <li className="flex gap-2 items-start"><span className="text-emerald-500">✓</span> Riwayat mutasi 7 hari terakhir</li>
            </ul>
            <Link href="/" className="w-full block text-center py-3 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Paket Anda</Link>
          </div>

          {/* PRO */}
          <div className="bg-emerald-600 rounded-3xl p-8 shadow-xl shadow-emerald-600/20 text-white relative flex flex-col transform md:-translate-y-4">
            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black px-3 py-1.5 rounded-bl-xl uppercase tracking-wider">Populer</div>
            <h3 className="text-xl font-bold mb-2">Pro / UMKM Naik Kelas</h3>
            <p className="text-sm text-emerald-100 mb-6 min-h-10">Fitur komplit untuk ekspansi usaha.</p>
            <div className="mb-2">
              <span className="text-4xl font-black">Rp49.000</span><span className="text-emerald-200">/bln</span>
            </div>
            <div className="mb-6">
              <span className="text-sm text-emerald-200">atau Rp349.000 / thn</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm text-emerald-50 flex-1">
              <li className="flex gap-2 items-start"><span className="text-white font-bold">✓</span> Unlimited katalog</li>
              <li className="flex gap-2 items-start"><span className="text-white font-bold">✓</span> Modul Stok & Supplier</li>
              <li className="flex gap-2 items-start"><span className="text-white font-bold">✓</span> Database Pelanggan</li>
              <li className="flex gap-2 items-start"><span className="text-white font-bold">✓</span> Modul Pengeluaran</li>
              <li className="flex gap-2 items-start"><span className="text-white font-bold">✓</span> Insight Rekomendasi Harian</li>
            </ul>
            <button onClick={() => handleUpgrade(49000, "Pro Bulanan")} disabled={loading === "Pro Bulanan"} className="w-full block text-center py-3 px-4 rounded-xl font-bold text-emerald-700 bg-white hover:bg-emerald-50 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait">
              {loading === "Pro Bulanan" ? "Memproses..." : "Upgrade Pro (Rp49rb/bln)"}
            </button>
            <button onClick={() => handleUpgrade(349000, "Pro Tahunan")} disabled={loading === "Pro Tahunan"} className="w-full block text-center py-3 px-4 mt-2 rounded-xl font-bold text-white bg-emerald-700 hover:bg-emerald-800 border border-emerald-500 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait">
              {loading === "Pro Tahunan" ? "Memproses..." : "Upgrade Pro (Rp349rb/thn)"}
            </button>
          </div>

          {/* LIFETIME */}
          <div className="bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-900/20 text-white relative flex flex-col">
            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-bl-xl uppercase tracking-wider">Batas 100 Orang</div>
            <h3 className="text-xl font-bold mb-2 text-white">Lifetime Founder Pass</h3>
            <p className="text-sm text-slate-400 mb-6 min-h-10">Bayar sekali, nikmati selamanya.</p>
            <div className="flex flex-col mb-6">
              <span className="text-lg text-slate-400 line-through font-medium">Rp1.500.000</span>
              <span className="text-4xl font-black text-white">Rp499.000</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm text-slate-300 flex-1">
              <li className="flex gap-2 items-start"><span className="text-emerald-400">✓</span> Semua Fitur Pro</li>
              <li className="flex gap-2 items-start"><span className="text-emerald-400">✓</span> Akses Seumur Hidup</li>
              <li className="flex gap-2 items-start"><span className="text-amber-400">★</span> Modul Marketing (Coming Soon)</li>
              <li className="flex gap-2 items-start"><span className="text-amber-400">★</span> Modul Konten (Coming Soon)</li>
            </ul>
            <button onClick={() => handleUpgrade(499000, "Lifetime")} disabled={loading === "Lifetime"} className="w-full block text-center py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait">
              {loading === "Lifetime" ? "Memproses..." : "Ambil Lifetime"}
            </button>
          </div>

        </div>
        <div className="mt-8 text-center">
          <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm font-semibold">&larr; Kembali ke Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
