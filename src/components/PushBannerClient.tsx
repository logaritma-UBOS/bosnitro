"use client"

import { useState } from "react"

export default function PushBannerClient({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      await action(formData)
      setIsOpen(false)
      alert("Banner berhasil dipublikasikan ke Dasbor Tenant!")
    } catch (err) {
      alert("Terjadi kesalahan sistem")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button 
        type="button" 
        onClick={() => setIsOpen(true)}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer shadow-lg shadow-blue-500/30"
      >
        SETTING & PUSH BANNER
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 text-slate-800 text-left">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800">Setting Banner Dasbor VIP</h2>
              <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <p className="text-sm text-slate-500 font-medium mb-2">Banner eksklusif ini akan merajai posisi teratas di halaman utama dasbor seluruh Tenant berstatus VIP.</p>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Judul Banner <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="title"
                  required
                  placeholder="Contoh: Fitur Eksklusif VIP Tersedia!"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Pesan / Deskripsi <span className="text-red-500">*</span></label>
                <textarea 
                  name="message"
                  required
                  rows={3}
                  placeholder="Contoh: Sebagai pengguna Premium, Anda kini mendapatkan akses prioritas ke modul Analitik AI. Silakan eksplorasi sekarang."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Teks Tombol Utama</label>
                  <input 
                    type="text" 
                    name="cta"
                    placeholder="Contoh: Lihat Fitur VIP"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">URL Tombol Utama</label>
                  <input 
                    type="text" 
                    name="ctaUrl"
                    placeholder="Contoh: /owner/analytics"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-8 pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyebarkan Banner...</span>
                    </>
                  ) : "Tampilkan Banner ke Semua VIP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}