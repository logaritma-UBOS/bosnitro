"use client"

import { useState, useRef, useEffect } from "react"

type AuditCameraModalProps = {
  isOpen: boolean
  auditType: "NITROGEN_PLATE" | "RETAIL_BOTTLE"
  onCaptureComplete: (photoUrl: string) => void
  onCancel: () => void
}

export default function AuditCameraModal({
  isOpen,
  auditType,
  onCaptureComplete,
  onCancel,
}: AuditCameraModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const title =
    auditType === "NITROGEN_PLATE"
      ? "📸 Audit Interlocking: Foto Plat Nomor Kendaraan"
      : "🧴 Audit Visual: Foto Botol Bekas Oli"

  const description =
    auditType === "NITROGEN_PLATE"
      ? "Wajib memotret plat nomor motor / mobil pelanggan. Katup pengisian solenoid nitrogen HANYA akan terbuka otomatis setelah foto terverifikasi."
      : "Wajib memotret botol oli bekas yang diganti untuk memastikan barang keluar fisik sesuai nota transaksi."

  useEffect(() => {
    let activeStream: MediaStream | null = null

    async function startCamera() {
      if (!isOpen || capturedImage) return
      setCameraError(null)

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        activeStream = mediaStream
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (err: any) {
        console.warn("Camera access warning:", err)
        setCameraError("Kamera otomatis tidak dapat diakses. Silakan gunakan tombol 'Ambil dari Kamera HP / File' di bawah.")
      }
    }

    if (isOpen && !capturedImage) {
      startCamera()
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop())
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isOpen, capturedImage])

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
      setCapturedImage(dataUrl)

      // Stop camera stream after snapshot
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        setStream(null)
      }
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setCapturedImage(reader.result as string)
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        setStream(null)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRetake = () => {
    setCapturedImage(null)
  }

  const handleConfirmPhoto = async () => {
    if (!capturedImage) return
    setIsUploading(true)

    try {
      // Convert data URL to Blob/File to upload
      const res = await fetch(capturedImage)
      const blob = await res.blob()
      const file = new File([blob], `audit_${auditType.toLowerCase()}_${Date.now()}.jpg`, {
        type: "image/jpeg",
      })

      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      })

      const data = await uploadRes.json()
      const finalUrl = data.url || capturedImage
      setIsUploading(false)
      onCaptureComplete(finalUrl)
    } catch (e) {
      console.error("Upload error, using local dataUrl:", e)
      setIsUploading(false)
      onCaptureComplete(capturedImage)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{description}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Content / Camera View */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col items-center justify-center bg-slate-900 relative">
          <canvas ref={canvasRef} className="hidden" />

          {capturedImage ? (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-emerald-500 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedImage} alt="Captured Audit" className="w-full h-full object-contain" />
              <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider shadow">
                ✓ Foto Berhasil Ditangkap
              </div>
            </div>
          ) : (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-700">
              {cameraError ? (
                <div className="p-6 text-center text-slate-300">
                  <span className="text-4xl block mb-2">📷</span>
                  <p className="text-xs text-amber-300 font-semibold">{cameraError}</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* Viewfinder Target Overlay */}
              <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="text-[11px] font-bold text-white/80 bg-black/50 px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs">
                  {auditType === "NITROGEN_PLATE" ? "Posisikan Plat Nomor di Kotak Ini" : "Posisikan Botol Oli Bekas"}
                </span>
              </div>
            </div>
          )}

          {/* Hidden File Input Fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                disabled={isUploading}
                className="w-full sm:w-1/3 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Ulangi Foto
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                disabled={isUploading}
                className="w-full sm:w-2/3 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                {isUploading ? (
                  <span>Mengunggah Bukti Audit...</span>
                ) : (
                  <>
                    <span>Gunakan Foto & Lanjutkan Transaksi</span>
                    <span>✓</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <span>📁 Upload / Kamera HP</span>
              </button>
              <button
                type="button"
                onClick={takeSnapshot}
                disabled={Boolean(cameraError)}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>📸 Tangkap Foto Sekarang</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
