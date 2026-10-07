"use client"

import { createBusiness } from "@/actions/business"
import { useActionState } from "react"
import Image from "next/image"
import { FormattedNumberInput } from "@/components/FormattedNumberInput"

export default function OnboardingPage() {
  const [state, action, pending] = useActionState<any, FormData>(createBusiness, null)

  const inputClass = "w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/40 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none text-sm font-medium text-slate-900"
  const btnClassPrimary = "w-full py-3.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col pt-8 pb-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      
      {/* Header Logo Resmi */}
      <div className="flex justify-center pt-8 pb-6">
        <Image alt="UBOS - Universal Business Operational System" className="h-12 md:h-14 w-auto object-contain" height={72} priority src="/logo-ubos.png" width={220}/>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 mb-12">
          
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Tentukan target omzet</h2>
          <p className="text-sm text-slate-500 mb-6">Metode Logaritma bekerja dengan mundur dari target akhir Anda.</p>

          <form action={action} className="space-y-6">
            
            {state?.error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 font-medium">
                {state.error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Target Omzet (Per Bulan) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-medium">Rp</span>
                  </div>
                  <FormattedNumberInput name="targetOmzet" required placeholder="10.000.000" className={`${inputClass} pl-12 pr-4`} />
                </div>
                <p className="mt-2 text-xs text-slate-500">Angka ini akan digunakan untuk menghitung kebutuhan penjualan harian Anda.</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Hari Buka (Per Minggu) *</label>
                <input name="operatingDays" type="number" min="1" max="7" defaultValue="7" required className={inputClass} />
              </div>
            </div>
            
            <div className="pt-2">
              <button type="submit" disabled={pending} className={btnClassPrimary}>
                <span>{pending ? "Menyimpan..." : "Simpan & Lanjut ke Dashboard"}</span>
                {!pending && <span>→</span>}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}