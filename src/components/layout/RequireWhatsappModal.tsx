"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { updatePhoneNumber } from "@/actions/auth";

export default function RequireWhatsappModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Only check if they are in dashboard/authenticated routes.
    // Exclude landing page, login, register, admin, etc.
    const isExcluded = pathname === '/' || pathname?.startsWith('/admin') || pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/thank-you');
    
    if (isExcluded) {
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    fetch("/api/user/status")
      .then(res => res.json())
      .then(data => {
        // If they are logged in but don't have a phone number, lock the screen!
        if (data.isAuthenticated && !data.hasPhone) {
          setIsOpen(true);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 9) return alert("Masukkan nomor WhatsApp yang valid.");
    
    setIsSubmitting(true);
    try {
      const res = await updatePhoneNumber(phone);
      if (res.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        alert(res.error || "Gagal menyimpan.");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md" style={{ pointerEvents: 'auto' }}>
      <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300 border-4 border-blue-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white relative">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black mb-2">Pembaruan Keamanan</h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            Untuk mengamankan akun dan mendapatkan akses notifikasi prioritas dari BOSNITRO, Anda wajib melengkapi nomor WhatsApp.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nomor WhatsApp Aktif <span className="text-rose-500">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">+62</span>
              <input 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="8123456789"
                required
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-semibold bg-slate-50 transition-colors"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">Data ini tidak akan dibagikan ke pihak ketiga.</p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan & Lanjutkan"}
          </button>
        </form>
      </div>
    </div>
  );
}