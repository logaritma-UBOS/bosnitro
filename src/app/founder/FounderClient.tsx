"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function FounderClient({ userName }: { userName: string }) {
  const [loading, setLoading] = useState(true)
  const [isVip, setIsVip] = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/user/status")
      .then(res => res.json())
      .then(data => {
        if (data.isVip) {
          setIsVip(true)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleCheckout = async (amount: number, planName: string, planDesc: string) => {
    setPayLoading(true)
    try {
      const res = await fetch("/api/mayar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, planName, planDesc })
      })
      const data = await res.json()
      if (data.link) {
        window.location.href = data.link
      } else {
        alert("Gagal membuat link pembayaran. Coba lagi nanti.")
        setPayLoading(false)
      }
    } catch (e) {
      alert("Terjadi kesalahan. Silakan coba lagi.")
      setPayLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (isVip) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-900 rounded-3xl p-8 text-white shadow-xl mb-8">
            <h1 className="text-3xl font-black mb-2">Selamat Datang di Dashboard Khusus Founder</h1>
            <p className="text-emerald-100">Terima kasih {userName} telah menjadi bagian dari 100 pemilik usaha pertama UBOS.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Akses Bisnis Anda</h3>
              <p className="text-slate-600 mb-4">Masuk ke sistem operasional utama untuk mengelola kasir, stok, dan laporan.</p>
              <Link href="/beranda" className="inline-block bg-slate-900 text-white font-bold py-2 px-6 rounded-xl hover:bg-slate-800">Buka UBOS</Link>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Komunitas Founder</h3>
              <p className="text-slate-600 mb-4">Grup WhatsApp eksklusif untuk diskusi strategi marketing dan update fitur UBOS.</p>
              <a href="#" className="inline-block bg-emerald-100 text-emerald-800 font-bold py-2 px-6 rounded-xl hover:bg-emerald-200">Gabung Grup WA</a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-b from-emerald-600 to-emerald-900 p-8 text-center text-white relative">
          <div className="absolute top-4 right-4">
            <Link href="/" className="text-emerald-200 hover:text-white">Batal</Link>
          </div>
          <h2 className="text-3xl font-black mb-2">Founder Pass</h2>
          <p className="text-emerald-100 text-sm">Selesaikan investasi Anda untuk membuka seluruh fitur UBOS tanpa batas seumur hidup.</p>
        </div>
        
        <div className="p-8">
                    <div className="space-y-4 mb-6">
            <button onClick={() => {}} className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 transition-colors flex justify-between items-center group">
              <div>
                <p className="font-bold text-slate-800">Pro (Bulanan)</p>
                <p className="text-xs text-slate-500">Akses Unlimited & Modul Dasar</p>
              </div>
              <div className="text-right">
                <p className="font-black text-lg text-slate-900">Rp 49.000</p>
                <p className="text-[10px] text-slate-400">/ bulan</p>
              </div>
              <div className="hidden group-hover:block absolute right-4"><button onClick={(e) => { e.stopPropagation(); handleCheckout(49000, "Paket PRO Bulanan", "Akses 1 Bulan"); }} className="bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-lg">Pilih</button></div>
            </button>

            <button onClick={() => {}} className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 transition-colors flex justify-between items-center group">
              <div>
                <p className="font-bold text-slate-800">Pro (Tahunan)</p>
                <p className="text-xs text-slate-500">Hemat Rp 239.000</p>
              </div>
              <div className="text-right">
                <p className="font-black text-lg text-slate-900">Rp 349.000</p>
                <p className="text-[10px] text-slate-400">/ tahun</p>
              </div>
              <div className="hidden group-hover:block absolute right-4"><button onClick={(e) => { e.stopPropagation(); handleCheckout(349000, "Paket PRO Tahunan", "Akses 1 Tahun"); }} className="bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-lg">Pilih</button></div>
            </button>

            <button onClick={() => {}} className="w-full text-left p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 transition-colors flex justify-between items-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">TERLARIS</div>
              <div>
                <p className="font-bold text-emerald-900">Lifetime Founder Pass</p>
                <p className="text-xs text-emerald-700">Akses Seumur Hidup + Marketing</p>
              </div>
              <div className="text-right mr-16 sm:mr-20">
                <p className="font-black text-lg text-emerald-900">Rp 399.000</p>
                <p className="text-[10px] text-emerald-600 line-through">Rp 1.500.000</p>
              </div>
              <div className="absolute right-4"><button onClick={(e) => { e.stopPropagation(); handleCheckout(399000, "Paket Lifetime Founder Pass", "Akses Seumur Hidup"); }} className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-md shadow-emerald-200" disabled={payLoading}>{payLoading ? "..." : "Pilih"}</button></div>
            </button>
          </div>

          
          <p className="text-center text-xs text-slate-400 mt-4">
            Pembayaran diproses secara aman oleh Mayar.id
          </p>
        </div>
      </div>
    </div>
  )
}
