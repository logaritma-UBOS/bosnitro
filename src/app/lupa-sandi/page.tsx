"use client"

import { requestPasswordReset } from "@/actions/auth"
import Link from "next/link"
import Image from "next/image"
import { useActionState } from "react"

export default function LupaSandiPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, null)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-5 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center mb-6 hover:opacity-90 transition-opacity">
          <Image alt="UBOS Logo" className="h-14 md:h-16 w-auto object-contain" height={72} priority src="/logo-ubos.png" width={220}/>
        </Link>
        <h1 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
          Lupa Kata Sandi
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500 max-w-sm mx-auto">
          Masukkan alamat email yang terdaftar, kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 sm:px-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <form className="space-y-5" action={action}>
            
            {state?.error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 font-medium">
                {state.error}
              </div>
            )}
            {state?.success && (
              <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm border border-emerald-100 font-medium">
                {state.success}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="contoh@email.com"
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50"
              />
            </div>

            <button
              disabled={pending}
              type="submit"
              className="w-full py-3 px-4 rounded-xl text-base font-bold text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {pending ? "Mengirim Tautan..." : "Kirim Tautan Reset"}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
              Kembali ke Halaman Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
