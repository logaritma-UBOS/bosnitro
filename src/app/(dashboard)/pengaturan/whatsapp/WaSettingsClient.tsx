"use client"

import { useState, useEffect } from "react"
import { getWaStatus, disconnectWa, saveActivationCode } from "@/actions/whatsapp"
import { Button } from "@/components/ui/Button"

export function WaSettingsClient() {
  const [status, setStatus] = useState<string>("LOADING")
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // States for Activation Flow
  const [activationCode, setActivationCode] = useState("")
  const [reqName, setReqName] = useState("")
  const [reqPhone, setReqPhone] = useState("")
  const [requestMode, setRequestMode] = useState<"FORM" | "INPUT_CODE">("FORM")
  
  const fetchStatus = async () => {
    try {
      const res = await getWaStatus()
      if (res.success) {
        setStatus(res.status || "ERROR")
        setQrCode(res.qr || null)
        setDeviceInfo(res.device || null)
      } else {
        setStatus("ERROR")
      }
    } catch (e) {
      setStatus("ERROR")
    }
  }

  useEffect(() => {
    fetchStatus()
    let interval: any
    if (status === "DISCONNECTED") {
      interval = setInterval(fetchStatus, 5000)
    }
    return () => clearInterval(interval)
  }, [status])

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reqName.trim() || !reqPhone.trim()) {
      alert("Harap isi Nama Toko dan Nomor WA")
      return
    }
    
    // Nomor WA Admin UBOS (hardcoded for pilot)
    const adminWa = "6285175150408"
    const text = `Halo Admin UBOS, saya ingin meminta akses fitur WA Blast.%0A%0ANama Toko: ${reqName}%0ANomor WA (untuk Blast): ${reqPhone}%0A%0AMohon bantu aktifkan dan berikan Kode Aktivasi sistem untuk toko saya. Terima kasih.`
    
    window.open(`https://wa.me/${adminWa}?text=${text}`, "_blank")
    setRequestMode("INPUT_CODE")
  }

  const handleSaveCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activationCode.trim()) return
    
    setIsSaving(true)
    const res = await saveActivationCode(activationCode.trim())
    if (res.success) {
      setActivationCode("")
      setStatus("LOADING")
      await fetchStatus()
    } else {
      alert(res.error || "Gagal menyimpan kode aktivasi")
    }
    setIsSaving(false)
  }

  const handleDisconnect = async () => {
    if (!confirm("Yakin ingin memutuskan koneksi WhatsApp dan menghapus kode aktivasi?")) return
    setIsSaving(true)
    await disconnectWa()
    setStatus("DISCONNECTED_NO_TOKEN")
    setRequestMode("FORM")
    setQrCode(null)
    setIsSaving(false)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Kolom 1: Status / Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            Status Koneksi
          </h2>
        </div>
        
        <div className="p-6 flex-1 flex flex-col justify-center">
          {status === "LOADING" && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <svg className="animate-spin h-8 w-8 mb-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm font-medium">Mengecek status WhatsApp...</p>
            </div>
          )}

          {(status === "DISCONNECTED_NO_TOKEN" || status === "INVALID_TOKEN") && requestMode === "FORM" && (
            <div className="flex flex-col items-center justify-center py-2 space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              
              <div className="text-center w-full">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Permintaan Akses WA Blast</h3>
                <p className="text-sm text-slate-500 mb-6 px-4">Silakan isi data berikut untuk meminta Admin mengaktifkan fitur WA Blast untuk toko Anda.</p>
                
                <form onSubmit={handleSendRequest} className="w-full flex flex-col space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Toko / Bisnis</label>
                    <input
                      type="text"
                      value={reqName}
                      onChange={(e) => setReqName(e.target.value)}
                      placeholder="Contoh: Nasi Uduk Bu Tejo"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nomor WA Pengirim (Blast)</label>
                    <input
                      type="text"
                      value={reqPhone}
                      onChange={(e) => setReqPhone(e.target.value)}
                      placeholder="Contoh: 085175150408"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-700"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 mt-2 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all">
                    Kirim Permintaan ke Admin
                  </Button>
                </form>
                
                <button onClick={() => setRequestMode("INPUT_CODE")} className="mt-6 text-xs text-slate-400 hover:text-slate-600 underline">
                  Saya sudah memiliki Kode Aktivasi
                </button>
              </div>
            </div>
          )}

          {(status === "DISCONNECTED_NO_TOKEN" || status === "INVALID_TOKEN") && requestMode === "INPUT_CODE" && (
            <div className="flex flex-col items-center justify-center py-2 space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              <div className="text-center w-full">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Masukkan Kode Aktivasi</h3>
                <p className="text-sm text-slate-500 mb-6 px-4">Masukkan Kode Aktivasi yang diberikan oleh Admin ke dalam kolom di bawah ini.</p>
                
                {status === "INVALID_TOKEN" && (
                   <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                     Kode aktivasi tidak valid atau telah kedaluwarsa.
                   </div>
                )}
                
                <form onSubmit={handleSaveCode} className="w-full flex flex-col space-y-3">
                  <input
                    type="text"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    placeholder="Contoh: rw47gsoTHcy86..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center font-mono text-slate-700"
                    disabled={isSaving}
                  />
                  <Button type="submit" disabled={isSaving || !activationCode.trim()} className="w-full h-11 text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all">
                    {isSaving ? "Memproses..." : "Simpan Kode Aktivasi"}
                  </Button>
                </form>
                
                <button onClick={() => setRequestMode("FORM")} className="mt-6 text-xs text-slate-400 hover:text-slate-600 underline">
                  Belum punya kode? Minta ke Admin
                </button>
              </div>
            </div>
          )}

          {status === "DISCONNECTED" && !qrCode && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Menunggu Terhubung...</h3>
              <p className="text-sm text-slate-500 max-w-xs">Sistem sedang menghubungi server WhatsApp atau Anda menggunakan metode Link Code.</p>
              
              <div className="flex gap-3 mt-4">
                <button onClick={fetchStatus} className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors">
                  Cek Status
                </button>
                <button onClick={handleDisconnect} disabled={isSaving} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                  Ganti Kode Aktivasi
                </button>
              </div>
            </div>
          )}

          {status === "DISCONNECTED" && qrCode && (
            <div className="flex flex-col items-center justify-center py-2">
              <h3 className="font-bold text-slate-800 mb-2 text-lg">Scan QR Code</h3>
              <p className="text-sm text-slate-500 text-center mb-6 max-w-[260px]">
                Jika WA Anda belum terhubung via Link Code, silakan scan barcode ini melalui menu <strong className="text-slate-700">Perangkat Taut</strong> di HP Anda.
              </p>
              
              <div className="bg-white p-3 rounded-2xl shadow-sm border-2 border-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} alt="WhatsApp QR Code" className="w-48 h-48 md:w-56 md:h-56 object-contain" />
              </div>
              
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <button onClick={fetchStatus} className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Segarkan Barcode
                </button>
                <button onClick={handleDisconnect} disabled={isSaving} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                  Ganti Kode
                </button>
              </div>
            </div>
          )}

          {status === "ERROR" && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Gagal Terhubung Server</h3>
              <p className="text-sm text-slate-500 max-w-xs">Terjadi kesalahan saat mengecek status token. Pastikan koneksi internet stabil.</p>
              
              <div className="flex gap-3 mt-4">
                <button onClick={fetchStatus} className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors">
                  Coba Lagi
                </button>
                <button onClick={handleDisconnect} disabled={isSaving} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                  Reset Form
                </button>
              </div>
            </div>
          )}

          {status === "CONNECTED" && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                <div className="w-24 h-24 bg-gradient-to-tr from-emerald-100 to-emerald-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg relative z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-slate-800 mb-1">Terhubung Aktif</h3>
              <p className="text-slate-500 font-medium mb-6 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {deviceInfo || 'Nomor WhatsApp Anda siap digunakan'}
              </p>
              
              <Button variant="danger" onClick={handleDisconnect} disabled={isSaving} className="px-6 rounded-xl">
                {isSaving ? "Memutuskan..." : "Hapus Integrasi"}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Kolom 2: Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-fit">
        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50">
          <h2 className="text-base font-bold text-slate-800">
            Alur Pendaftaran (Khusus Member)
          </h2>
        </div>
        <div className="p-6 text-slate-600 text-sm md:text-base leading-relaxed">
          <p className="mb-4">
            Fitur <strong>WA Blast Terisolasi</strong> ini membutuhkan aktivasi manual oleh Admin untuk mendaftarkan nomor server khusus bagi toko Anda.
          </p>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">1</div>
              <p>Isi form di samping dengan <strong>Nama Toko</strong> dan <strong>Nomor WA</strong> Anda.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">2</div>
              <p>Klik tombol <strong>Kirim Permintaan</strong>. Anda akan diarahkan ke chat WA Admin.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">3</div>
              <p>Admin akan memproses pendaftaran, dan membalas chat Anda dengan <strong>Kode Aktivasi</strong> (Kombinasi huruf & angka rahasia).</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p>Masukkan kode tersebut ke dalam sistem UBOS, lalu status Anda akan langsung <strong>Terhubung Aktif</strong>!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}