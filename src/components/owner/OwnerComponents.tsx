"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function OwnerSidebar() {
  const pathname = usePathname()
  
  const links = [
    { href: "/owner/overview", label: "Ringkasan Kondisi Usaha", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { href: "/owner/leads", label: "Calon Pembeli / Prospek", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { href: "/owner/backward-mapping", label: "Peta Target & Masalah", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> },
    { href: "/owner/solutions", label: "Daftar Solusi & Menu Aksi", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg> },
    { href: "/owner/ubos", label: "UBOS Monitoring", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    { href: "/owner/coway", label: "COWAY Monitoring", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg> },
    { href: "/owner/services", label: "Digital Services", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg> },
    { href: "/owner/affiliate", label: "Affiliates", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> },
    { href: "/owner/conversions", label: "Tingkat Keberhasilan Aksi", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
    { href: "/owner/revenue", label: "Total Omzet Ekosistem", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { href: "/owner/activity", label: "Activity Timeline", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
    { href: "/owner/analytics", label: "Analytics", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { href: "/owner/audit", label: "Audit Logs", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
  ]

  return (
    <div className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col hidden md:flex shrink-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
          <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          LOGARITMA 
        </h1>
        <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">Pusat Kendali Bisnis</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(link => {
          const isActive = pathname === link.href || pathname?.startsWith(link.href + "/")
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-slate-800 text-white" : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to App
        </Link>
      </div>
    </div>
  )
}

export function OwnerTopbar() {
  return (
    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
      <div className="font-semibold text-slate-800">
        Pusat Kendali Bisnis
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
          Live System
        </div>
        <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
          OW
        </div>
      </div>
    </div>
  )
}

export function OwnerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <OwnerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <OwnerTopbar />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export function OwnerMetricCard({ title, value, subtitle, icon, trend }: { title: string, value: string | number, subtitle?: string, icon?: React.ReactNode, trend?: "UP" | "DOWN" | "NEUTRAL" }) {
  const isUnavailable = value === "Unavailable"

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className={`text-sm font-bold uppercase tracking-wider ${isUnavailable ? 'text-slate-400' : 'text-slate-500'}`}>{title}</h3>
        {icon && <span className={`text-slate-400 ${isUnavailable && 'opacity-50'}`}>{icon}</span>}
      </div>
      <div className="mt-auto">
        {isUnavailable ? (
          <div className="flex flex-col gap-1">
            <p className="text-3xl font-bold text-slate-300">—</p>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 w-fit">
              Data belum terhubung
            </span>
          </div>
        ) : (
          <>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            {subtitle && (
              <div className="flex items-center gap-1 mt-1">
                {trend === "UP" && <span className="text-emerald-500 text-xs font-bold">↑</span>}
                {trend === "DOWN" && <span className="text-rose-500 text-xs font-bold">↓</span>}
                {trend === "NEUTRAL" && <span className="text-slate-400 text-xs font-bold">-</span>}
                <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function OwnerUnavailableState({ title = "Belum Terhubung", message = "Fitur atau data ini sedang dalam tahap pengembangan dan belum siap ditampilkan." }) {
  return (
    <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center h-full">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-200 mb-3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 className="text-base font-bold text-slate-400 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm">{message}</p>
    </div>
  )
}

export function OwnerDataConfidence({ level }: { level: "LOW" | "MEDIUM" | "HIGH" }) {
  const colors = {
    LOW: "bg-rose-100 text-rose-800 border-rose-200",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
    HIGH: "bg-emerald-100 text-emerald-800 border-emerald-200"
  }
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${colors[level]}`}>
      Confidence: {level}
    </span>
  )
}

export function OwnerTracePanel({ id, type, source }: { id: string, type: string, source: string }) {
  return (
    <div className="bg-slate-800 text-slate-300 p-3 rounded-lg text-xs font-mono flex flex-col gap-1 mt-2">
      <div className="flex justify-between">
        <span className="text-slate-500">TRACE ID:</span>
        <span className="text-indigo-300">{id}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">ENTITY:</span>
        <span>{type}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">SOURCE:</span>
        <span className="text-emerald-300">{source}</span>
      </div>
    </div>
  )
}
