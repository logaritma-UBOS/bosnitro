"use client"

import { useState } from "react"
import { saveTokoSettings } from "@/actions/toko-online"
import Link from "next/link"
import { IconWarning } from "@/components/ui/Icons"

export default function TokoClient({ initialSlug, initialDesc, initialActive, phone }: { initialSlug: string, initialDesc: string, initialActive: boolean, phone: string }) {
  const [slug, setSlug] = useState(initialSlug)
  const [desc, setDesc] = useState(initialDesc)
  const [active, setActive] = useState(initialActive)
  const [waPhone, setWaPhone] = useState(phone || "")
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (active && !waPhone) {
       alert("Nomor WhatsApp belum diisi. Pesan dari Toko Online akan masuk ke WA Anda, jadi wajib diisi.")
       return
    }

    setLoading(true)
    try {
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      
      const res = await saveTokoSettings({
        storeSlug: cleanSlug,
        storeDescription: desc,
        storeActive: active,
        storePhone: waPhone
      })
      if (res.success) {
        alert("Pengaturan toko berhasil disimpan")
        setSlug(cleanSlug)
      }
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan pengaturan")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!slug) return alert("Silakan tentukan URL Toko dan Simpan terlebih dahulu")
    const url = window.location.origin + "/toko/" + slug
    navigator.clipboard.writeText(url)
    alert("Link berhasil disalin:\n" + url)
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 lg:items-start">
      <div className="bg-white p-5 lg:p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 lg:col-span-2">
        <h2 className="font-bold text-gray-900 mb-6 lg:text-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-violet-600"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
          Pengaturan Dasar
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status Toko</label>
            <div className="flex items-center justify-between p-4 lg:p-5 bg-gray-50 rounded-2xl border border-gray-200 cursor-pointer hover:border-violet-200 transition-colors" onClick={() => setActive(!active)}>
              <div>
                <p className="font-bold text-gray-900">{active ? "Toko Buka" : "Toko Tutup"}</p>
                <p className="text-xs text-gray-500 mt-0.5">{active ? "Pembeli bisa melihat katalog & pesan" : "Toko disembunyikan sementara"}</p>
              </div>
              <div className={"w-14 h-8 rounded-full p-1 transition-colors shrink-0 " + (active ? "bg-emerald-500" : "bg-gray-300")}>
                <div className={"w-6 h-6 bg-white rounded-full transition-transform " + (active ? "translate-x-6" : "")}></div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nomor WA Penerima Order</label>
              <input 
                type="text"
                value={waPhone} 
                onChange={e => setWaPhone(e.target.value)} 
                placeholder="Contoh: 08123456789"
                className={"w-full bg-gray-50 rounded-2xl border p-4 text-sm font-medium text-gray-900 outline-none focus:ring-2 ring-violet-500 focus:bg-white transition-colors " + (!waPhone && active ? "border-amber-400" : "border-gray-200")}
              />
              {!waPhone && active && (
                 <div className="mt-2 flex gap-2 text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                   <IconWarning className="w-4 h-4 shrink-0 mt-0.5" />
                   <p className="text-[11px] leading-snug font-medium">Nomor WA wajib diisi agar pembeli bisa Checkout ke Anda.</p>
                 </div>
              )}
              {waPhone && (
                 <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">Pastikan nomor ini aktif dan terhubung ke WhatsApp.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tautan URL Toko</label>
              <div className="flex bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-2 ring-violet-500 focus-within:bg-white transition-colors">
                 <div className="px-3 py-4 bg-gray-100 border-r border-gray-200 text-gray-500 text-sm font-medium whitespace-nowrap">
                   ubos.id/toko/
                 </div>
                 <input 
                   value={slug} 
                   onChange={e => setSlug(e.target.value)} 
                   placeholder="nama-toko-anda"
                   className="w-full bg-transparent px-3 py-4 text-sm font-bold text-gray-900 outline-none"
                 />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">Gunakan huruf, angka, dan tanda strip (-) tanpa spasi.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Deskripsi Singkat</label>
            <textarea 
              value={desc} 
              onChange={e => setDesc(e.target.value)} 
              placeholder="Selamat datang di toko kami..."
              className="w-full bg-gray-50 rounded-2xl border border-gray-200 p-4 text-sm font-medium text-gray-900 outline-none focus:ring-2 ring-violet-500 focus:bg-white transition-colors min-h-[100px] resize-y"
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full lg:w-auto lg:px-8 bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
          >
            {loading ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>

      <div className="bg-violet-50 p-5 lg:p-6 rounded-3xl border border-violet-100 lg:col-span-1 lg:sticky lg:top-24 shadow-sm">
        <div className="w-10 h-10 bg-violet-200 text-violet-700 rounded-xl flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
        </div>
        <h2 className="font-bold text-violet-900 mb-2 lg:text-lg">Sebarkan Toko Anda</h2>
        <p className="text-xs lg:text-sm text-violet-700 mb-6 leading-relaxed">Bagikan link toko ini ke bio Instagram, TikTok, atau WhatsApp pelanggan Anda.</p>
        
        <button 
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 bg-white text-violet-700 font-bold py-3.5 lg:py-4 rounded-2xl border border-violet-200 shadow-sm transition-all active:scale-95 hover:border-violet-300"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Salin Link Toko Online
        </button>
        {slug && (
          <Link href={`/toko/${slug}`} target="_blank" className="w-full flex items-center justify-center gap-2 mt-3 text-violet-700 font-bold py-3.5 lg:py-4 hover:bg-violet-100/50 rounded-2xl transition-all">
            Lihat Tampilan Toko &rarr;
          </Link>
        )}
      </div>
    </div>
  )
}
