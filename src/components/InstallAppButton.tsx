"use client";

import { useEffect, useState } from "react";

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for Android install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone) return null; // Don't show if already installed

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSPrompt(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Fallback if beforeinstallprompt hasn't fired but user clicked
      alert("Untuk install: Ketik menu (titik tiga) di pojok kanan atas lalu pilih 'Tambahkan ke Layar Utama' atau 'Install Aplikasi'.");
    }
  };

  return (
    <>
      <button 
        onClick={handleInstallClick}
        className="w-full lg:hidden mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        <span>Download Aplikasi (Android & iOS)</span>
      </button>

      {/* iOS Install Instructions Modal */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowIOSPrompt(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl mb-8 animate-in slide-in-from-bottom-8" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-2">Install di iPhone/iPad</h3>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Ketuk tombol <strong>Share/Bagikan</strong> di bagian bawah layar Safari, lalu gulir ke bawah dan pilih <strong>"Tambahkan ke Layar Utama"</strong>.
            </p>
            <button 
              onClick={() => setShowIOSPrompt(false)}
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl active:scale-95 transition-all"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
