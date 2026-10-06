"use client"

import { createBusiness } from "@/actions/business"
import { useActionState, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { FormattedNumberInput } from "@/components/FormattedNumberInput"

export default function OnboardingPage() {
  const [state, action, pending] = useActionState(createBusiness, null)
  const [step, setStep] = useState(1)
  const [businessType, setBusinessType] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  const businessTypes = [
    { id: "F&B", label: "F&B", desc: "Makanan & Minuman", icon: "🍔" },
    { id: "RETAIL", label: "Toko/Retail", desc: "Jual Beli Barang", icon: "🛍️" },
    { id: "PRINTING", label: "Fotocopy", desc: "Percetakan & Fotocopy", icon: "🖨️" },
    { id: "JASA", label: "Jasa", desc: "Layanan & Servis", icon: "✂️" },
  ]

  const nextStep = (e: React.MouseEvent) => {
    e.preventDefault()
    setStep(s => Math.min(s + 1, 3))
  }
  
  const prevStep = (e: React.MouseEvent) => {
    e.preventDefault()
    setStep(s => Math.max(s - 1, 1))
  }

  const inputClass = "w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/40 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none text-sm font-medium text-slate-900"
  
  const btnClassPrimary = "w-full py-3.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
  const btnClassSecondary = "w-full py-3.5 px-6 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col pt-8 pb-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      
      {/* Header Logo Resmi */}
      <div className="flex justify-center pt-8 pb-6">
        <Image alt="UBOS - Universal Business Operational System" className="h-12 md:h-14 w-auto object-contain" height={72} priority src="/logo-ubos.png" width={220}/>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 mb-12">
          
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="text-emerald-600">Langkah {step} dari 3</span>
              <span className="text-slate-500">
                {step === 1 ? "Profil Usaha" : step === 2 ? "Target Bisnis" : "Produk Pertama"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className={`h-1.5 rounded-full ${step >= 1 ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
              <div className={`h-1.5 rounded-full ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
              <div className={`h-1.5 rounded-full ${step >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
            </div>
          </div>

          <form action={action} className="space-y-6">
            
            {state?.error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 font-medium">
                {state.error}
              </div>
            )}

            {/* STEP 1: Profil Usaha */}
            <div className={step === 1 ? 'block' : 'hidden'}>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-6 tracking-tight">Ceritakan tentang usaha Anda</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Usaha *</label>
                  <input name="name" type="text" required={step===1} placeholder="Contoh: Kedai Kopi Senja" className={inputClass} />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Jenis Usaha *</label>
                  <input type="hidden" name="businessType" value={businessType} required={step===1} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {businessTypes.map(type => (
                      <div 
                        key={type.id}
                        onClick={() => setBusinessType(type.id)}
                        className={`transition-all rounded-2xl p-4 text-left cursor-pointer border-2 ${
                          businessType === type.id 
                            ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 shadow-xs' 
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <span className="text-2xl block mb-2">{type.icon}</span>
                        <span className="block text-sm font-bold text-slate-900">{type.label}</span>
                        <span className="block text-xs text-slate-500 mt-0.5">{type.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <button type="button" onClick={nextStep} disabled={!businessType} className={btnClassPrimary}>
                  <span>Lanjut ke Langkah 2</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* STEP 2: Target Bisnis */}
            <div className={step === 2 ? 'block' : 'hidden'}>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Tentukan target omzet</h2>
              <p className="text-sm text-slate-500 mb-6">Metode Logaritma bekerja dengan mundur dari target akhir Anda.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Target Omzet (Per Bulan) *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-500 font-medium">Rp</span>
                    </div>
                    <FormattedNumberInput name="targetOmzet" required={step===2} placeholder="10.000.000" className={`${inputClass} pl-12 pr-4`} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Angka ini akan digunakan untuk menghitung kebutuhan penjualan harian Anda.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Hari Buka (Per Minggu) *</label>
                  <input name="operatingDays" type="number" min="1" max="7" defaultValue="7" required={step===2} className={inputClass} />
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <div className="w-1/3">
                  <button type="button" onClick={prevStep} className={btnClassSecondary}>
                    <span>←</span>
                    <span className="hidden sm:inline">Kembali</span>
                  </button>
                </div>
                <div className="w-2/3">
                  <button type="button" onClick={nextStep} className={btnClassPrimary}>
                    <span>Lanjut</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 3: Produk Pertama */}
            <div className={step === 3 ? 'block' : 'hidden'}>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Tambahkan produk pertama</h2>
              <p className="text-sm text-slate-500 mb-6">Anda bisa menambahkan lebih banyak produk nanti di Katalog.</p>
              
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed text-center relative overflow-hidden group">
                  {previewUrl ? (
                    <div className="relative w-32 h-32 mx-auto mb-3">
                      <Image src={previewUrl} alt="Preview" fill className="object-cover rounded-xl shadow-sm border border-slate-200" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 mx-auto bg-slate-200 rounded-full flex items-center justify-center mb-3">
                      <span className="text-2xl text-slate-400">📷</span>
                    </div>
                  )}
                  <label className="block text-sm font-bold text-emerald-700 cursor-pointer hover:underline">
                    {previewUrl ? "Ganti Foto" : "Upload Foto Produk"}
                    <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
                  </label>
                  <p className="text-xs text-slate-500 mt-1">Format JPG, PNG, WebP (Max 5MB)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Produk</label>
                  <input name="productName" type="text" placeholder="Contoh: Kopi Susu Aren" className={inputClass} />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Harga Jual</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-500 font-medium">Rp</span>
                    </div>
                    <FormattedNumberInput name="sellPrice" placeholder="20.000" className={`${inputClass} pl-12 pr-4`} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Harga Beli / Modal (HPP)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-500 font-medium">Rp</span>
                    </div>
                    <FormattedNumberInput name="purchaseCost" placeholder="10.000" className={`${inputClass} pl-12 pr-4`} />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <div className="w-1/3">
                  <button type="button" onClick={prevStep} disabled={pending} className={btnClassSecondary}>
                    <span>←</span>
                    <span className="hidden sm:inline">Kembali</span>
                  </button>
                </div>
                <div className="w-2/3">
                  <button type="submit" disabled={pending} className={btnClassPrimary}>
                    <span>{pending ? "Menyimpan..." : "Selesai"}</span>
                    {!pending && <span>✓</span>}
                  </button>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}