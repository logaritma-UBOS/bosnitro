"use client"

import { loginUser } from "@/actions/auth"
import Link from "next/link"
import Image from "next/image"
import { useActionState, useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"

function QueryErrorAlert() {
  const searchParams = useSearchParams()
  const error = searchParams?.get("error")

  if (!error) return null

  let message = "Terjadi kendala saat otentikasi. Silakan coba kembali."
  if (error === "OAuthAccountNotLinked") {
    message = "Email ini sudah terdaftar menggunakan metode login lain. Silakan masuk menggunakan kata sandi Anda."
  } else if (error === "CredentialsSignin") {
    message = "Email atau kata sandi tidak sesuai."
  } else if (error === "AccessDenied" || error === "access_denied") {
    message = "Akses login dibatalkan atau tidak diizinkan."
  }

  return (
    <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-xl text-sm border border-amber-200 font-medium mb-4">
      {message}
    </div>
  )
}

function LoginForm() {
  const [state, action, pending] = useActionState(loginUser, null)
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-5 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">

        {/* Logo */}
        <Link href="/" className="flex justify-center mb-6 hover:opacity-90 transition-opacity">
          <Image alt="UBOS - Universal Business Operational System" className="h-14 md:h-16 w-auto object-contain" height={72} priority src="/logo-ubos.png" width={220}/>
        </Link>

        {/* Headline */}
        <h1 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
          Masuk ke UBOS
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Selamat datang kembali. Kendalikan angka bisnis Anda.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 sm:px-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
          
          {/* Tombol Google OAuth di atas */}
          <button
            type="button"
            disabled={googleLoading}
            onClick={() => {
              setGoogleLoading(true);
              signIn("google", { callbackUrl: "/beranda" });
            }}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            {googleLoading ? <span>Memuat...</span> : <span>Google</span>}
          </button>

          {/* Divider Pemisah */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">atau masuk dengan email</span>
            </div>
          </div>

          <Suspense fallback={null}>
            <QueryErrorAlert />
          </Suspense>

          <form className="space-y-5" action={action}>

            {/* Error Form Submission */}
            {state?.error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 font-medium">
                {state.error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="contoh@email.com"
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-slate-50"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Kata Sandi
                </label>
                <Link href="/lupa-sandi" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Lupa kata sandi?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Kata sandi Anda"
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-slate-50 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? (
                    <EyeIcon className="h-5 w-5" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              disabled={pending}
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-base font-bold text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 transition-all mt-2"
            >
              {pending ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/register" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              Belum punya akun? Daftar
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm font-medium">Memuat...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
