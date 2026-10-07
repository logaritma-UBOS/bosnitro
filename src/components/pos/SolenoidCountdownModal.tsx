"use client"

import { useState, useEffect } from "react"
import { Gauge, Clock, CheckCircle2 } from "lucide-react"

type SolenoidCountdownModalProps = {
  isOpen: boolean
  timerSeconds: number
  serviceName: string
  vehiclePhotoUrl?: string | null
  receiptNumber: string
  onClose: () => void
}

export default function SolenoidCountdownModal({
  isOpen,
  timerSeconds,
  serviceName,
  vehiclePhotoUrl,
  receiptNumber,
  onClose,
}: SolenoidCountdownModalProps) {
  const [remaining, setRemaining] = useState(timerSeconds)
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setRemaining(timerSeconds)
    setIsFinished(false)

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsFinished(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, timerSeconds])

  if (!isOpen) return null

  const progressPercent = Math.max(0, Math.min(100, ((timerSeconds - remaining) / timerSeconds) * 100))

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 text-center p-6 sm:p-8 flex flex-col items-center">
        {/* Header Badge */}
        <div
          className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider mb-6 flex items-center gap-2 ${
            isFinished ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-800"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isFinished ? "bg-slate-400" : "bg-emerald-500 animate-ping"}`}></span>
          <Gauge className="w-3.5 h-3.5" />
          <span>{isFinished ? "Katup Solenoid Tertutup Otomatis" : "ESP32 Solenoid Valve Sedang Terbuka"}</span>
        </div>

        {/* Circular Countdown Progress */}
        <div className="relative w-44 h-44 mb-6 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              className="text-slate-100 stroke-current"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              className={`${isFinished ? "text-slate-400" : "text-emerald-500"} stroke-current transition-all duration-1000`}
              strokeWidth="8"
              strokeDasharray="264"
              strokeDashoffset={264 - (264 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight tabular-nums">
              {remaining}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Detik Sisa</span>
            </span>
          </div>
        </div>

        {/* Details Card */}
        <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Layanan</span>
            <span className="font-bold text-slate-800">{serviceName}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Nomor Nota</span>
            <span className="font-mono font-bold text-emerald-700">{receiptNumber}</span>
          </div>
          {vehiclePhotoUrl && (
            <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vehiclePhotoUrl}
                alt="Plat Nomor"
                className="w-10 h-10 object-cover rounded-lg border border-slate-300 shrink-0"
              />
              <p className="text-[11px] text-slate-500 leading-tight">
                Foto Plat Nomor Terverifikasi di Cloud Storage
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 ${
            isFinished
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
              : "bg-slate-800 hover:bg-slate-900 text-white"
          }`}
        >
          {isFinished ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesai & Buka Transaksi Baru</span>
            </>
          ) : (
            <span>Tutup Jendela (Katup Tetap Menghitung)</span>
          )}
        </button>
      </div>
    </div>
  )
}
