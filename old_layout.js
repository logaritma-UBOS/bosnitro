import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import MidnightAutoLogout from "@/components/MidnightAutoLogout";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UBOS Pilot",
  manifest: "/api/manifest-pilot",
  appleWebApp: {
    title: "UBOS Pilot",
    statusBarStyle: "default",
  },
};

export default async function PilotLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  const ALLOWED_EMAILS = [
    "logaritma.tim@gmail.com",
    "tony@logaritma.id",
    "reza@logaritma.id",
    "bana@logaritma.id"
  ];

  if (!session?.user) {
    redirect("/admin/pilot/login");
  }

  if (!session?.user?.email || !ALLOWED_EMAILS.includes(session.user.email)) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <MidnightAutoLogout />
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-red-100">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Akses Ditolak</h1>
          <p className="text-slate-600 mb-8 text-sm">
            Area operasional internal Pilot. Akun <strong className="text-slate-800">{session?.user?.email || "Anonim"}</strong> tidak memiliki otoritas otorisasi untuk masuk ke kokpit.
          </p>
          <div className="flex flex-col gap-3">
             <Link href="/" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200">
               Kembali ke Dasbor User
             </Link>
             <form action={async () => {
               "use server";
               await signOut({ redirectTo: "/admin/pilot/login" });
             }}>
               <button type="submit" className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all">
                 Ganti Akun (Logout)
               </button>
             </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-slate-900">
      <MidnightAutoLogout />
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 sticky top-0 h-screen overflow-y-auto justify-between">
        <div className="p-6 border-b border-gray-100">
          <Link href="/admin/pilot" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-lg">U</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">UBOS<span className="text-blue-600">Pilot</span></h1>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-6">
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3 px-2">Menu Utama</h3>
            <div className="space-y-1">
              <Link href="/admin/pilot" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-slate-900 hover:bg-slate-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 0120.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                Dashboard
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3 px-2">Kelola</h3>
            <div className="space-y-1">
              <Link href="/admin/pilot/trafik" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                Trafik
              </Link>
              <Link href="/admin/pilot/konversi" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-emerald-600 hover:bg-emerald-50">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Konversi
              </Link>
              <Link href="/admin/pilot/relationship" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-purple-600 hover:bg-purple-50">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                Relationship
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3 px-2">Rawat</h3>
            <div className="space-y-1">
              <Link href="/admin/pilot/feedback" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-amber-600 hover:bg-amber-50">Masukan / Saran</Link>
              <Link href="/admin/pilot/feed" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-amber-600 hover:bg-amber-50">Konten Feed Premium</Link>
            </div>
          </div>
          
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3 px-2">Tumbuh</h3>
            <div className="space-y-1">
              <Link href="/admin/pilot/promo" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">Promo</Link>
              <Link href="/admin/pilot/marketing" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">Marketing</Link>
              <Link href="/admin/pilot/konten" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">Konten In-App</Link>
              <Link href="/admin/pilot/kalender-konten" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">Kalender Konten</Link>
              <Link href="/admin/pilot/sosmed-feed" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">Feed Sosmed</Link>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3 px-2">Performa</h3>
            <div className="space-y-1">
              <Link href="/admin/pilot/performa-tim" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-cyan-600 hover:bg-cyan-50">Performa Tim</Link>
              <Link href="/admin/pilot/performa-trafik" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-cyan-600 hover:bg-cyan-50">Performa Trafik</Link>
              <Link href="/admin/pilot/performa-konversi" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-cyan-600 hover:bg-cyan-50">Performa Konversi</Link>
              <Link href="/admin/pilot/performa-relationship" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-cyan-600 hover:bg-cyan-50">Performa Relationship</Link>
            </div>
          </div>
        </nav>

        {/* User Info / Logout */}
        <div className="p-4 border-t border-gray-100 flex flex-col gap-3 bg-gray-50 mt-auto">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div className="truncate">
              <p className="text-[10px] font-semibold text-slate-400">Selamat datang,</p>
              <p className="text-xs font-bold text-slate-800 truncate">@{session?.user?.name || "Admin"}</p>
            </div>
          </div>
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/pilot/login" });
          }}>
            <button type="submit" className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Logout">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
            </button>
          </form>
          </div>
        </div>
      </aside>


      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 relative pb-[80px] lg:pb-0" suppressHydrationWarning>
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-[68px] z-50">
        <Link href="/admin/pilot" className="flex flex-col items-center justify-center w-[20%] h-full text-blue-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[10px] font-bold mt-0.5">Beranda</span>
        </Link>
        <Link href="/admin/pilot/trafik" className="flex flex-col items-center justify-center w-[20%] h-full text-gray-400 hover:text-blue-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          <span className="text-[10px] font-semibold mt-0.5">Trafik</span>
        </Link>
        
        {/* CENTER BUTTON */}
        <div className="relative w-[20%] flex justify-center -mt-7">
          <Link href="/admin/pilot/konversi" className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 rounded-full flex flex-col items-center justify-center text-white shadow-xl shadow-emerald-500/30 border-[3px] border-white active:scale-95 transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </Link>
        </div>

        <Link href="/admin/pilot/relationship" className="flex flex-col items-center justify-center w-[20%] h-full text-gray-400 hover:text-purple-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
          <span className="text-[10px] font-semibold mt-0.5">Rawat</span>
        </Link>
        <Link href="/admin/pilot/menu" className="flex flex-col items-center justify-center w-[20%] h-full text-gray-400 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
          <span className="text-[10px] font-semibold mt-0.5">Lainnya</span>
        </Link>
      </div>
    </div>
  )
}
