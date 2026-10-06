import { getPromos } from "@/actions/promo"
import PromoClient from "./PromoClient"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function PromoPage() {
  const { promos, error } = await getPromos()

  return (
        <div className="min-h-screen bg-gray-50 max-w-5xl mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-primary-600 mb-1 inline-block">← Kembali ke Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900">Promo & Diskon</h1>
        <p className="text-gray-500">Kelola penawaran promo untuk pelanggan.</p>
      </div>
      
      {error ? (
        <div className="p-4 bg-red-50 text-red-500 rounded-xl">Gagal memuat promo.</div>
      ) : (
        <PromoClient initialPromos={promos || []} />
      )}
    </div>
      )
}