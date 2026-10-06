"use client"

import { useState } from "react"

export default function PushNotifClient({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      await action(formData)
      setIsOpen(false)
      alert("Notifikasi Push berhasil dikirim ke target pengguna!")
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
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer shadow-lg shadow-yellow-500/30"
      >
        SETTING & PUSH NOTIFIKASI
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 text-slate-800 text-left">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800">Setting Notifikasi In-App</h2>
              <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <p className="text-sm text-slate-500 font-medium mb-2">Notifikasi ini akan dikirim masuk ke logo bel (Lonceng) di dasbor para Tenant berstatus Premium (VIP).</p>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Judul Notifikasi <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="title"
                  required
                  placeholder="Contoh: Terima Kasih atas Dukungan Anda!"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Isi Pesan <span className="text-red-500">*</span></label>
                <textarea 
                  name="message"
                  required
                  rows={3}
                  placeholder="Contoh: Dukungan Anda membuat UBOS terus berkembang. Jika butuh bantuan, hubungi kami."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Teks Tombol (Opsional)</label>
                  <input 
                    type="text" 
                    name="cta"
                    placeholder="Contoh: Buka"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">URL Tombol (Opsional)</label>
                  <input 
                    type="text" 
                    name="ctaUrl"
                    placeholder="Contoh: /laporan"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-8 pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold shadow-md shadow-yellow-200 transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Mengirim Massal...</span>
                    </>
                  ) : "Kirim Notifikasi ke Semua VIP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
