import { formatRupiah } from '@/lib/format';
export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import Link from "next/link";
import { runOwnerEngine } from "@/lib/engines/ownerEngine";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import DailyActivityForm from "./DailyActivityForm";
import InstallAppButton from "@/components/InstallAppButton";

export default async function AdminPilotPage() {
  const session = await auth();
  const userEmail = session?.user?.email || "";
  const userName = session?.user?.name || "Admin";
  
  const TARGET_EMAILS = [
    "logaritma.tim@gmail.com",
    "tony@logaritma.id",
    "reza@logaritma.id",
    "bana@logaritma.id"
  ];
  const isInternalTeam = TARGET_EMAILS.includes(userEmail);

  async function updateTarget(formData: FormData) {
    "use server";
    const newTarget = formData.get("target")?.toString();
    if (newTarget) {
      await prisma.systemSetting.upsert({
        where: { key: "MONTHLY_REVENUE_TARGET" },
        update: { value: newTarget },
        create: { key: "MONTHLY_REVENUE_TARGET", value: newTarget }
      });
      revalidatePath("/admin/pilot");
    }
  }

  const { target, actual, gap, recommendation, metrics } = await runOwnerEngine();

  const progressPct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  const progressMsg = progressPct >= 100 
    ? "Luar biasa! Target bulan ini telah terlampaui." 
    : progressPct >= 50 
      ? "Sedikit lagi menuju target. Terus dorong konversi!" 
      : "Fokus tingkatkan pendaftaran & konversi user premium.";

  return (
    <div className="w-full font-sans">
      {/* MOBILE ONLY HEADER (Mirrors tenant UI top part) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-lg">U</span>
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none">UBOS<span className="text-blue-600">Pilot</span></h1>
            <p className="text-[10px] text-gray-500">Dashboard Owner</p>
          </div>
        </div>
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
        
        {/* DESKTOP HEADER */}
        <div className="hidden md:flex justify-between items-end mb-8 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard Owner</h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              Pantau matrik kunci & operasional SaaS Anda.
            </p>
          </div>
        </div>

        {isInternalTeam && (
          <DailyActivityForm userName={userName} userEmail={userEmail} />
        )}

        <InstallAppButton />

        {/* METRICS CARDS */}
        <div className="mb-8 lg:mb-10">
          {/* MOBILE VIEW (< lg) */}
          <div className="lg:hidden bg-white rounded-2xl border border-gray-100 p-4 md:p-6 shadow-sm mb-6">
            <div className="flex justify-between items-center mb-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em]">Kondisi Bisnis Bulan Ini</p>
            </div>
            
            <div className="pb-3 border-b border-gray-100 flex flex-col gap-2">
              <div className="flex justify-between items-baseline">
                <p className="text-xs font-semibold text-gray-400">Target Bulanan</p>
                <p className="text-sm font-bold text-gray-600">{formatRupiah(target)}</p>
              </div>
              <form action={updateTarget} className="flex gap-2 w-full mt-1">
                <input type="number" name="target" defaultValue={target} placeholder="Ubah target..." className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 bg-gray-50" required />
                <button type="submit" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 text-xs px-3 py-1.5 rounded-lg font-bold shrink-0">Simpan</button>
              </form>
            </div>

            <div className="py-3 md:py-4">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.12em] mb-1">Tercapai</p>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight tabular-nums">{formatRupiah(actual)}</h2>
              
              <div className="mt-3 space-y-1.5">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${progressPct >= 100 ? "bg-success-500" : progressPct >= 60 ? "bg-blue-500" : progressPct >= 1 ? "bg-warning-500" : "bg-gray-200"}`}
                    style={{ width: `${Math.max(progressPct, 0)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">{progressMsg}</p>
              </div>
            </div>

            {gap > 0 && (
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <div className="flex-1 bg-red-50 rounded-xl p-3 border border-red-100">
                  <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.12em] mb-1">Kekurangan (GAP)</p>
                  <p className="text-base font-black text-red-600 tabular-nums">-{formatRupiah(gap)}</p>
                </div>
              </div>
            )}
          </div>

          {/* DESKTOP VIEW (>= lg) */}
          <div className="hidden lg:grid grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em]">Target Bulanan</p>
                </div>
                <form action={updateTarget} className="flex gap-2 mb-3">
                  <input type="number" name="target" defaultValue={target} placeholder="Ubah target..." className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 bg-gray-50" required />
                  <button type="submit" className="bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 text-sm px-4 py-1.5 rounded-lg font-bold shrink-0 transition-colors">Simpan</button>
                </form>
                <p className="text-2xl font-black text-gray-900 tabular-nums">{formatRupiah(target)}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.12em] mb-2">Tercapai</p>
                <p className="text-2xl font-black text-gray-900 tabular-nums">{formatRupiah(actual)} <span className="text-sm font-bold text-gray-400">({progressPct}%)</span></p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${progressPct >= 100 ? "bg-success-500" : progressPct >= 60 ? "bg-blue-500" : progressPct >= 1 ? "bg-warning-500" : "bg-gray-200"}`}
                    style={{ width: `${Math.max(progressPct, 0)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 font-medium">{progressMsg}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.12em] mb-2">Kekurangan (Gap)</p>
                <p className="text-2xl font-black text-red-600 tabular-nums">-{formatRupiah(gap)}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Fokus dorong pendapatan bulan ini</p>
              </div>
            </div>
          </div>
        </div>

        {/* LOGARITMA ENGINE (PRIORITAS HARI INI) */}
        <div className="mt-6 mb-8 lg:mb-10 lg:grid lg:grid-cols-[200px_1fr] lg:gap-8 items-start">
          <div className="hidden lg:block pt-2">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Prioritas</h2>
            <p className="text-xs text-gray-500 font-medium">Analisa AI berdasarkan metrik *funnel* SaaS.</p>
          </div>

          <div className="w-full relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl blur opacity-25"></div>
            <div className="relative bg-gradient-to-br from-slate-50 to-blue-50/30 border border-blue-100/50 rounded-2xl p-5 lg:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">≡ƒöÑ</span>
                <h2 className="text-sm font-black text-blue-900 tracking-wide uppercase">Prioritas Hari Ini</h2>
                <div className="ml-auto flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-full border border-blue-100">
                  <div className="w-2 h-2 rounded-full bg-success-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  <span className="text-[10px] font-bold text-success-700 uppercase tracking-wider">Engine Aktif</span>
                </div>
              </div>

              <h3 className="text-lg lg:text-2xl font-black text-slate-800 leading-tight mb-4 lg:w-11/12">
                {recommendation.actionText}
              </h3>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 lg:p-5 border border-white shadow-sm mb-5">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.12em] mb-2 lg:mb-3">Kenapa?</p>
                <p className="text-sm lg:text-base font-medium text-gray-700 leading-relaxed mb-3 lg:mb-4">
                  {recommendation.reason}
                </p>
                
                <div className="grid grid-cols-3 gap-2 lg:gap-4 pt-3 lg:pt-4 border-t border-gray-100">
                  <div className="text-center lg:text-left">
                    <p className="text-[9px] text-gray-400 font-semibold uppercase lg:mb-1">Total User</p>
                    <p className="text-xs lg:text-sm font-black text-gray-700 tabular-nums">{metrics.totalUsers}</p>
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-[9px] text-gray-400 font-semibold uppercase lg:mb-1">User Gratis</p>
                    <p className="text-xs lg:text-sm font-black text-gray-700 tabular-nums">{metrics.freeUsers}</p>
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-[9px] text-gray-400 font-semibold uppercase lg:mb-1">User Premium</p>
                    <p className="text-xs lg:text-sm font-black text-blue-600 tabular-nums">{metrics.premiumUsers}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Link
                  href={recommendation.ctaHref}
                  className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all whitespace-nowrap"
                >
                  {recommendation.ctaLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
