"use client"
import { formatNumber, formatRupiah } from '@/lib/format'
import { FormattedNumberInput } from '@/components/FormattedNumberInput'

import { editProduct } from "@/actions/catalog"
import Link from "next/link"
import Image from "next/image"
import { useActionState, useState } from "react"

export default function EditProductClient({ product, suppliers }: { product: any, suppliers: any[] }) {
  const [state, action, pending] = useActionState(editProduct, null)
  
  // existing preview URL if available
  const [previewUrl, setPreviewUrl] = useState<string | null>(product.imageUrl || null)

  const isRetail = !product.hasBOM && product.trackInventory;
  const isService = !product.hasBOM && !product.trackInventory;
  const isBom = product.hasBOM;

  let behaviorText = "Resep / BOM";
  if (isRetail) behaviorText = "Jual Langsung (Ritel)";
  if (isService) behaviorText = "Jasa Murni";

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(product.imageUrl || null)
    }
  }

  return (
    <div className="min-h-screen bg-white p-4 pb-32 md:p-8 md:max-w-2xl lg:max-w-3xl mx-auto rounded-xl shadow-sm my-4 border border-gray-100">
      <Link href="/katalog" className="text-sm text-gray-500 font-semibold mb-6 inline-block hover:text-gray-900 transition-colors">&larr; Batal</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Produk</h1>
      
      <form action={action} className="space-y-5">
        <input type="hidden" name="id" value={product.id} />
        {state?.error && <div className="text-danger-600 text-sm bg-danger-50 border border-danger-200 p-3 rounded-lg font-medium">{state.error}</div>}
        
        {/* Photo Upload Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 border-dashed text-center relative overflow-hidden group">
          {previewUrl ? (
            <div className="relative w-32 h-32 mx-auto mb-3">
              <Image src={previewUrl} alt="Preview" fill className="object-cover rounded-xl shadow-sm border border-gray-200" />
            </div>
          ) : (
            <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl text-gray-400">📷</span>
            </div>
          )}
          <label className="block text-sm font-bold text-primary-700 cursor-pointer hover:underline">
            {previewUrl ? "Ganti Foto" : "Upload Foto Produk"}
            <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
          </label>
          <p className="text-xs text-gray-500 mt-1">Format JPG, PNG, WebP (Max 5MB)</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Jenis Barang (Terkunci)</label>
          <input type="text" readOnly disabled value={behaviorText} className="block w-full border border-gray-200 bg-gray-100 rounded-xl p-3 text-gray-500 cursor-not-allowed" />
          <p className="text-xs text-gray-500 mt-1.5">Sifat dasar produk tidak dapat diubah setelah dibuat.</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Produk</label>
          <input name="name" type="text" defaultValue={product.name} required className="block w-full border border-gray-300 rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Harga Jual</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
            <FormattedNumberInput name="sellPrice" step="any" defaultValue={product.sellPrice} required className="block w-full border border-gray-300 rounded-xl p-3 pl-10 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" />
          </div>
        </div>

        {isRetail && (
          <>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Harga Beli / Modal (HPP)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                <FormattedNumberInput name="purchaseCost" step="any" defaultValue={product.purchaseCost || product.calculatedHpp} required className="block w-full border border-gray-300 rounded-xl p-3 pl-10 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">Mengubah HPP akan memperbarui margin keuntungan Anda.</p>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Supplier (Opsional)</label>
              <select name="supplierId" defaultValue={product.supplierId || ""} className="block w-full border border-gray-300 rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all">
                <option value="">-- Tanpa Supplier --</option>
                {suppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {isBom && (
          <div className="bg-info-50 border border-info-200 text-info-800 text-sm p-4 rounded-xl flex items-start gap-3">
            <span className="text-lg">ℹ️</span>
            <p>HPP produk resep ini adalah {formatRupiah(product.calculatedHpp)}. HPP hanya dapat diubah dengan memodifikasi komponen bahan baku di halaman detail produk.</p>
          </div>
        )}

        <button disabled={pending} type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl mt-8 disabled:opacity-50 transition-colors shadow-md">
          {pending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>
    </div>
  )
}
