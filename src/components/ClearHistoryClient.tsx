"use client"

import { useState } from "react"

export default function ClearHistoryClient({ action }: { action: () => Promise<void> }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await action()
      alert("Riwayat berhasil dihapus! Semua Banner dan Notifikasi In-App telah ditarik dari Dasbor Tenant.")
    } catch (err) {
      alert("Terjadi kesalahan sistem")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="whitespace-nowrap bg-red-500/10 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500 text-xs font-bold py-2.5 px-5 rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
      >
        {isSubmitting ? "Menarik Riwayat..." : "Hapus & Tarik Semua Riwayat"}
      </button>
    </form>
  )
}