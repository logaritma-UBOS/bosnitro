"use client"

import { useState, useEffect } from "react"
import { getUnreadNotifications, markAsRead, trackNotificationClick } from "@/actions/notifications"
import Link from "next/link"

export default function VipBannerWrapper() {
  const [notif, setNotif] = useState<any>(null)

  useEffect(() => {
    loadBanner()
  }, [])

  async function loadBanner() {
    try {
      const data = await getUnreadNotifications()
      // Cari notifikasi khusus banner yang belum dibaca
      const banner = data.find((n: any) => n.trigger === "DASHBOARD_BANNER" && !n.readAt)
      setNotif(banner || null)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDismiss = async () => {
    if (!notif) return;
    setNotif(null)
    await markAsRead([notif.id])
  }

  const handleClick = async () => {
    if (!notif) return;
    await trackNotificationClick(notif.id)
  }

  if (!notif) return null;

  return (
    <div className="mb-4 relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-indigo-900 shadow-md border border-indigo-500/30">
      <div className="absolute top-0 right-0 p-4 z-10">
        <button onClick={handleDismiss} className="text-slate-400 hover:text-white transition-colors bg-slate-900/50 rounded-full p-1.5 backdrop-blur-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="p-4 pr-10 flex flex-row gap-4 items-center">
        <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md shadow-orange-500/30 ">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
        
        <div className="flex-1 text-left">
          <div className="inline-flex items-center gap-1.5 bg-yellow-500/20 text-yellow-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
            Eksklusif VIP
          </div>
          <h3 className="text-base md:text-lg font-bold text-white mb-0.5 leading-tight">
            {notif.title || "Pengumuman Spesial VIP"}
          </h3>
          <p className="text-indigo-200 text-xs leading-snug line-clamp-2 max-w-xl">
            {notif.message}
          </p>
        </div>
        
        {notif.ctaUrl && (
          <div className="shrink-0">
            <Link 
              href={notif.ctaUrl}
              onClick={handleClick}
              className="inline-flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-2 px-4 text-xs rounded-lg transition-all active:scale-95 shadow-md"
            >
              {notif.cta || "Lihat Sekarang"}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}