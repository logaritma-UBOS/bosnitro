"use client"

import React, { useState, useEffect } from "react"
import {
  isBluetoothSupported,
  isBluetoothConnected,
  getConnectedDeviceName,
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  testPrintBluetooth,
  subscribeBluetoothState,
} from "@/lib/bluetoothPrinter"
import {
  Bluetooth,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Smartphone,
  HelpCircle,
  Sparkles,
} from "lucide-react"

interface BluetoothPrinterModalProps {
  isOpen: boolean
  onClose: () => void
  storeName?: string
  paperSize?: "58mm" | "80mm"
  onPaperSizeChange?: (size: "58mm" | "80mm") => void
}

export default function BluetoothPrinterModal({
  isOpen,
  onClose,
  storeName = "UBOS NITROGEN",
  paperSize = "58mm",
  onPaperSizeChange,
}: BluetoothPrinterModalProps) {
  const [connected, setConnected] = useState(false)
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [testing, setTesting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    setSupported(isBluetoothSupported())
    const unsubscribe = subscribeBluetoothState((isConnected, name) => {
      setConnected(isConnected)
      setDeviceName(name)
    })
    return () => unsubscribe()
  }, [])

  if (!isOpen) return null

  const handleConnect = async () => {
    setConnecting(true)
    setFeedback(null)
    try {
      const res = await connectBluetoothPrinter()
      if (res.success) {
        setFeedback({ type: "success", message: res.message })
      } else {
        setFeedback({ type: "error", message: res.message })
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Gagal menyambungkan ke printer Bluetooth.",
      })
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = () => {
    disconnectBluetoothPrinter()
    setFeedback({ type: "success", message: "Koneksi printer Bluetooth telah diputuskan." })
  }

  const handleTestPrint = async () => {
    setTesting(true)
    setFeedback(null)
    try {
      const res = await testPrintBluetooth(storeName, paperSize)
      if (res.success) {
        setFeedback({ type: "success", message: res.message || "Struk uji cetak berhasil dicetak!" })
      } else {
        setFeedback({ type: "error", message: res.message || "Gagal mencetak struk." })
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Gagal mengirim data cetak ke printer.",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Bluetooth className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Integrasi Printer Mini Bluetooth</h3>
            <p className="text-xs text-slate-500">
              Sambungkan thermal printer mini 58mm / 80mm via Web Bluetooth
            </p>
          </div>
        </div>

        {/* Browser support check alert */}
        {!supported && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Browser Belum Mendukung Web Bluetooth</span>
              Gunakan browser <b>Google Chrome</b> di Android atau Laptop/PC. Untuk HP Android, Anda juga bisa menggunakan opsi pencetakan via aplikasi <b>RawBT</b>.
            </div>
          </div>
        )}

        {/* Live Status Card */}
        <div
          className={`p-4 rounded-2xl border transition-all mb-5 flex items-center justify-between ${
            connected
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
              : "bg-slate-50 border-slate-200 text-slate-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                connected ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider">Status Printer</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    connected ? "bg-emerald-200 text-emerald-900" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {connected ? "● Terhubung" : "○ Belum Terhubung"}
                </span>
              </div>
              <p className="text-xs font-bold mt-0.5">
                {connected ? deviceName || "Mini Thermal Printer" : "Belum ada printer Bluetooth tersambung"}
              </p>
            </div>
          </div>

          {connected && (
            <button
              type="button"
              onClick={handleDisconnect}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              Putuskan
            </button>
          )}
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`mb-5 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
              feedback.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          {!connected ? (
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-2xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Bluetooth className="w-4 h-4" />
              <span>{connecting ? "Mencari & Menyambungkan..." : "Sambungkan Printer Bluetooth Sekarang"}</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleTestPrint}
                disabled={testing}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>{testing ? "Mencetak..." : "Uji Cetak Struk (Test)"}</span>
              </button>
              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ganti Perangkat</span>
              </button>
            </div>
          )}
        </div>

        {/* Settings: Paper Size */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-800">Format Kertas Thermal</span>
            {onPaperSizeChange && (
              <div className="flex gap-1 font-bold">
                <button
                  type="button"
                  onClick={() => onPaperSizeChange("58mm")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    paperSize === "58mm"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  58mm (Standar Mini)
                </button>
                <button
                  type="button"
                  onClick={() => onPaperSizeChange("80mm")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    paperSize === "80mm"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  80mm (Lebar)
                </button>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Ukuran 58mm mencetak 32 karakter per baris (kompatibel dengan printer mini RPP02N, GOOJPRT, Panda, Eppos, dll).
          </p>
        </div>

        {/* Panduan Penggunaan Singkat */}
        <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-500 space-y-2">
          <p className="font-bold text-slate-700 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Petunjuk Koneksi Bluetooth:</span>
          </p>
          <ol className="list-decimal pl-4 space-y-1 text-slate-600">
            <li>Nyalakan printer thermal mini dan pastikan lampu indikator power/ready menyala.</li>
            <li>Aktifkan <b>Bluetooth</b> dan <b>Lokasi (GPS)</b> pada perangkat HP/Tablet/Laptop Anda.</li>
            <li>Klik tombol <b>Sambungkan Printer Bluetooth</b> di atas.</li>
            <li>Pilih nama printer Anda (misal: <i>RPP02N, MPT-II, POS-58, atau Bluetooth Printer</i>) pada jendela Chrome yang muncul.</li>
            <li>Setelah status menjadi <b>● Terhubung</b>, klik <b>Uji Cetak Struk</b> untuk memverifikasi.</li>
          </ol>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  )
}
