"use client"

import { resetPassword } from "@/actions/auth"
import Link from "next/link"
import Image from "next/image"
import { useActionState, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"

function ResetSandiForm() {
  const [state, action, pending] = useActionState(resetPassword, null)
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  if (!token) {
    return (
      <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 font-medium text-center">
        Tautan reset tidak valid. Silakan kembali ke halaman Lupa Kata Sandi.
      </div>
    )
  }

  return (
    <form className="space-y-5" action={action}>
      <input type="hidden" name="token" value={token} />
      
      {state?.error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 font-medium">
          {state.error}
        </div>
      )}
      {state?.success ? (
        <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm border border-emerald-100 font-medium text-center">
          {state.success}
          <div className="mt-4">
            <Link href="/login" className="inline-block px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">
              Masuk Sekarang
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Minimal 8 karakter"
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-12 bg-slate-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            disabled={pending}
            type="submit"
            className="w-full py-3 px-4 rounded-xl text-base font-bold text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            {pending ? "Memproses..." : "Simpan Kata Sandi"}
          </button>
        </>
      )}
    </form>
  )
}

export default function ResetSandiPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-5 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center mb-6 hover:opacity-90 transition-opacity">
          <Image alt="UBOS Logo" className="h-14 md:h-16 w-auto object-contain" height={72} priority src="/logo-ubos.png" width={220}/>
        </Link>
        <h1 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
          Buat Sandi Baru
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500 max-w-sm mx-auto">
          Silakan masukkan kata sandi baru untuk mengamankan akun Anda.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 sm:px-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <Suspense fallback={<div className="text-center text-sm text-slate-500">Memuat...</div>}>
            <ResetSandiForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
