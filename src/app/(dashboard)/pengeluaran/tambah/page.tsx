"use client"
import { FormattedNumberInput } from '@/components/FormattedNumberInput'

import { addExpense } from "@/actions/finance"
import Link from "next/link"
import { useActionState } from "react"

export default function TambahPengeluaranPage() {
  const [state, action, pending] = useActionState(addExpense, null)

  const kategori = [
    "Bahan Baku", "Listrik", "Gas", "Transportasi", "Gaji", "Kemasan", "Marketing", "Lainnya"
  ]

  return (
    <div className="min-h-screen bg-white p-6 max-w-md mx-auto">
      <Link href="/pengeluaran" className="text-sm text-gray-500 font-semibold mb-6 inline-block">← Batal</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Catat Pengeluaran</h1>
      
      <form action={action} className="space-y-4">
        {state?.error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{state.error}</div>}
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Nominal</label>
          <FormattedNumberInput name="amount" required placeholder="Rp" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-gray-900 text-lg font-bold" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Kategori</label>
          <select name="category" required className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-gray-900">
            <option value="">-- Pilih Kategori --</option>
            {kategori.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Catatan Tambahan (Opsional)</label>
          <input name="description" type="text" placeholder="Contoh: Beli token listrik" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-gray-900" />
        </div>

        <button disabled={pending} type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-md mt-6 disabled:opacity-50">
          {pending ? "Menyimpan..." : "Simpan Pengeluaran"}
        </button>
      </form>
    </div>
  )
}
