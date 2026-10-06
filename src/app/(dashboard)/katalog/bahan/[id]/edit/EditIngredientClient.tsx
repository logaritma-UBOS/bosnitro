"use client"
import { FormattedNumberInput } from '@/components/FormattedNumberInput'

import { editIngredient } from "@/actions/catalog"
import Link from "next/link"
import { useActionState } from "react"

export default function EditIngredientClient({ ingredient, suppliers }: { ingredient: any, suppliers: any[] }) {
  const [state, action, pending] = useActionState(editIngredient, null)

  return (
    <div className="min-h-screen bg-white p-6 max-w-md mx-auto">
      <Link href="/katalog" className="text-sm text-gray-500 font-semibold mb-6 inline-block">← Batal</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Bahan Baku</h1>
      
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={ingredient.id} />
        {state?.error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{state.error}</div>}
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Nama Bahan</label>
          <input name="name" type="text" defaultValue={ingredient.name} required className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-gray-900" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Update Harga Beli (Opsional)</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-2.5 text-gray-500 text-sm">Rp</span>
            <FormattedNumberInput name="purchasePrice" step="any" placeholder="Contoh: 50000" className="block w-full border border-gray-300 rounded-md p-2 pl-9 text-gray-900" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Isi jika harga bahan berubah. (Wajib isi Jumlah/Berat juga)</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Jumlah / Berat</label>
            <FormattedNumberInput name="purchaseQuantity" step="any" placeholder="Contoh: 1000" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Satuan</label>
            <input name="unit" type="text" defaultValue={ingredient.unit} required className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-gray-900" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier (Opsional)</label>
          <select name="supplierId" defaultValue={ingredient.supplierId || ""} className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">-- Tanpa Supplier --</option>
            {suppliers.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <details className="group border border-gray-200 rounded-md p-2">
          <summary className="text-sm font-medium text-gray-700 cursor-pointer list-none flex justify-between items-center">
            <span>Opsi Lanjutan & Stok</span>
            <span className="group-open:rotate-180 transition-transform">-</span>
          </summary>
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Cost Per Unit Saat Ini</label>
              <FormattedNumberInput name="manualCostPerUnit" step="any" defaultValue={ingredient.costPerUnit} required className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-gray-900 bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stok Saat Ini</label>
              <FormattedNumberInput name="currentStock" step="any" defaultValue={ingredient.currentStock} className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-gray-900" />
            </div>
          </div>
        </details>

        <button disabled={pending} type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-md mt-6 disabled:opacity-50">
          {pending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>
    </div>
  )
}