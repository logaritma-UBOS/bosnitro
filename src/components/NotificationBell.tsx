"use client";

import { useState, useEffect } from "react";
import { getUnreadNotifications, markAsRead, trackNotificationClick } from "@/actions/notifications";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => {
      loadNotifications();
    }, 5000); // Realtime polling every 5s
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      const data = await getUnreadNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.readAt).length);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleOpen() {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      const ids = notifications.filter(n => !n.readAt).map(n => n.id);
      if (ids.length > 0) {
        await markAsRead(ids);
        setUnreadCount(0);
      }
    }
  }

  async function handleClick(n: any) {
    await trackNotificationClick(n.id, n.campaignId);
    if (n.ctaUrl) {
      window.location.href = n.ctaUrl;
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={handleOpen}
        className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-96">
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Notifikasi</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                Belum ada notifikasi baru.
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} onClick={() => handleClick(n)} className={`p-3 rounded-lg border cursor-pointer transition-colors ${!n.readAt ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-xs ${!n.readAt ? 'font-bold text-blue-900' : 'font-semibold text-slate-700'}`}>{n.title || "Pesan dari UBOS"}</h4>
                    <span className="text-[9px] text-slate-400 shrink-0 ml-2">{new Date(n.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug mb-2">{n.message}</p>
                  {n.cta && (
                    <span className="inline-block px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                      {n.cta}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
