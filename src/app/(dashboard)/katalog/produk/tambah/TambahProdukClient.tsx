"use client"
import { formatRupiah } from '@/lib/format'
import { FormattedNumberInput } from '@/components/FormattedNumberInput'

import { addProduct } from "@/actions/catalog"
import Link from "next/link"
import Image from "next/image"
import { useActionState, useState } from "react"

export default function TambahProdukClient({ businessType }: { businessType: string }) {
  const [state, action, pending] = useActionState(addProduct, null)
  
  // Default logic: F&B gets BOM, RETAIL gets RETAIL, others get SERVICE/BOM
  const defaultType = businessType === 'F_AND_B' ? 'BOM' : (businessType === 'RETAIL' ? 'RETAIL' : 'SERVICE')
  const [itemType, setItemType] = useState(defaultType)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Dynamic Recipe State
  const [ingredients, setIngredients] = useState([{ id: Date.now(), name: '', unit: '', purchaseQty: 1, purchaseTotal: 0, recipeQty: 1 }])
  const [yieldQty, setYieldQty] = useState(1)
  
  const addIngredient = () => setIngredients([...ingredients, { id: Date.now(), name: '', unit: '', purchaseQty: 1, purchaseTotal: 0, recipeQty: 1 }])
  const removeIngredient = (id: number) => setIngredients(ingredients.filter(i => i.id !== id))
  const updateIngredient = (id: number, field: string, value: string | number) => {
    setIngredients(ingredients.map(i => i.id === id ? { ...i, [field]: value } : i))
  }
  
  const totalHppBOM = ingredients.reduce((sum, ing) => {
    const costPerUnit = ing.purchaseQty > 0 ? (ing.purchaseTotal / ing.purchaseQty) : 0
    const hppBatch = costPerUnit * ing.recipeQty
    return sum + hppBatch
  }, 0)
  
  const hppPerPortion = yieldQty > 0 ? (totalHppBOM / yieldQty) : 0

  const downloadTemplate = () => {
    // Menggunakan titik koma (;) agar langsung rapi di Excel region Indonesia
    const csvContent = "Nama Bahan;Satuan;Terpakai\nBeras;gram;200\nAyam;gram;100\nBumbu Kuning;gram;50"
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "template_resep_ubos.csv")
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return
      
      const lines = text.split('\n')
      const imported = []
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        
        // Support CSV dengan pemisah koma (Google Sheets) maupun titik koma (Excel ID)
        const parts = line.split(/[,;]/)
        if (parts.length >= 3) {
          imported.push({
            id: Date.now() + i,
            name: parts[0].trim(),
            unit: parts[1].trim(),
            purchaseQty: 0,
            purchaseTotal: 0,
            recipeQty: parseFloat(parts[2].trim()) || 0
          })
        }
      }
      
      if (imported.length > 0) {
        setIngredients(imported)
      } else {
        alert('File CSV kosong atau format tidak sesuai. Silakan download template terlebih dahulu.')
      }
    }
    reader.readAsText(file)
    e.target.value = '' // reset input
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  return (
    <div className="min-h-screen bg-white p-4 pb-32 md:p-8 md:max-w-2xl lg:max-w-3xl mx-auto rounded-xl shadow-sm my-4 border border-gray-100">
      <Link href="/katalog" className="text-sm text-gray-500 font-semibold mb-6 inline-block hover:text-gray-900 transition-colors">&larr; Batal</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tambah Produk</h1>
      
      <form action={action} className="space-y-5">
        {state?.error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-lg font-medium">{state.error}</div>}
        
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
          <label className="block text-sm font-bold text-emerald-700 cursor-pointer hover:underline">
            {previewUrl ? "Ganti Foto" : "Upload Foto Produk"}
            <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
          </label>
          <p className="text-xs text-gray-500 mt-1">Format JPG, PNG, WebP (Max 5MB)</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Produk / Layanan</label>
          <input name="name" type="text" required placeholder="Contoh: Nasi Goreng / Jasa Potong" className="block w-full border border-gray-300 rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
        </div>
        
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <label className="block text-sm font-bold text-gray-700 mb-3">Jenis Penjualan</label>
          <div className="flex flex-col md:flex-row gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-900 bg-white p-2.5 rounded-lg border border-gray-200 cursor-pointer flex-1 hover:border-emerald-300">
              <input type="radio" name="itemType" value="BOM" checked={itemType === 'BOM'} onChange={(e) => setItemType(e.target.value)} className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
              Racikan / Resep
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-900 bg-white p-2.5 rounded-lg border border-gray-200 cursor-pointer flex-1 hover:border-emerald-300">
              <input type="radio" name="itemType" value="RETAIL" checked={itemType === 'RETAIL'} onChange={(e) => setItemType(e.target.value)} className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
              Barang Ritel
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-900 bg-white p-2.5 rounded-lg border border-gray-200 cursor-pointer flex-1 hover:border-emerald-300">
              <input type="radio" name="itemType" value="CONSIGNMENT" checked={itemType === 'CONSIGNMENT'} onChange={(e) => setItemType(e.target.value)} className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
              Konsinyasi / Titipan
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-900 bg-white p-2.5 rounded-lg border border-gray-200 cursor-pointer flex-1 hover:border-emerald-300">
              <input type="radio" name="itemType" value="SERVICE" checked={itemType === 'SERVICE'} onChange={(e) => setItemType(e.target.value)} className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
              Jasa Murni
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Harga Jual</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
            <FormattedNumberInput name="sellPrice" step="any" required placeholder="0" className="block w-full border border-gray-300 rounded-xl p-3 pl-10 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
          </div>
        </div>

        {(itemType === 'RETAIL' || itemType === 'CONSIGNMENT') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Modal Dasar (HPP)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                <FormattedNumberInput name="purchaseCost" step="any" required placeholder="0" className="block w-full border border-gray-300 rounded-xl p-3 pl-10 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Stok Awal Fisik</label>
              <FormattedNumberInput name="initialStock" step="any" placeholder="0" defaultValue="0" className="block w-full border border-gray-300 rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
            </div>
          </div>
        )}

        {itemType === 'BOM' && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-2">
              <h3 className="font-bold text-emerald-900 text-sm">Resep & Modal (HPP)</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={downloadTemplate} className="text-xs font-medium bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                  ⬇️ Template CSV
                </button>
                <label className="text-xs font-bold bg-white border border-emerald-300 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors shadow-sm">
                  📥 Import Resep
                  <input type="file" accept=".csv" className="hidden" onChange={handleImportCsv} />
                </label>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm ml-0 md:ml-2">
                  HPP per Porsi: {formatRupiah(hppPerPortion)}
                </span>
              </div>
            </div>
            
            {ingredients.map((ing) => (
              <div key={ing.id} className="bg-white p-3 rounded-xl shadow-sm border border-emerald-100 relative group flex flex-col gap-3">
                {ingredients.length > 1 && (
                  <button type="button" onClick={() => removeIngredient(ing.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-full w-6 h-6 flex items-center justify-center text-lg font-bold shadow-sm transition-colors z-10">&times;</button>
                )}
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nama Bahan</label>
                    <input type="text" name="ingredientName" value={ing.name} required placeholder="Cth: Daging Sapi / Gula" className="w-full border border-gray-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-emerald-500 outline-none" onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)} />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Satuan</label>
                    <input type="text" name="ingredientUnit" value={ing.unit} required placeholder="gr/ml/pcs" className="w-full border border-gray-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-emerald-500 outline-none" onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)} />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1" title="Beli berapa banyak?">Beli Sebanyak</label>
                    <input type="number" step="any" min="0" name="ingredientPurchaseQty" value={ing.purchaseQty || ''} required placeholder="1000" className="w-full border border-gray-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-emerald-500 outline-none" onChange={(e) => updateIngredient(ing.id, 'purchaseQty', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Total Bayar</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">Rp</span>
                      <FormattedNumberInput name="ingredientPurchaseTotal" required className="w-full border border-gray-300 rounded-lg text-sm p-2 pl-6 focus:ring-2 focus:ring-emerald-500 outline-none" onChangeValue={(val) => updateIngredient(ing.id, 'purchaseTotal', val)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1" title="Berapa yang dipakai untuk resep ini?">Terpakai (Resep)</label>
                    <input type="number" step="any" min="0" name="ingredientRecipeQty" value={ing.recipeQty || ''} required placeholder="200" className="w-full border border-gray-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-emerald-500 outline-none" onChange={(e) => updateIngredient(ing.id, 'recipeQty', parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
              </div>
            ))}
            
            <button type="button" onClick={addIngredient} className="w-full py-2 bg-emerald-100/50 border border-emerald-200 text-emerald-700 font-bold text-sm rounded-xl hover:bg-emerald-200 transition-colors">
              + Tambah Komponen Bahan
            </button>

            <div className="mt-4 pt-4 border-t border-emerald-200/60">
               <label className="block text-xs font-bold text-emerald-900 mb-2">Racikan di atas menghasilkan berapa porsi?</label>
               <div className="flex items-center gap-2">
                  <input type="number" step="any" min="1" name="recipeYield" required defaultValue={1} className="w-24 border border-gray-300 rounded-lg text-sm p-2 text-center focus:ring-2 focus:ring-emerald-500 outline-none" onChange={(e) => setYieldQty(parseFloat(e.target.value) || 1)} />
                  <span className="text-sm font-medium text-gray-600">Porsi / Menu siap jual</span>
               </div>
            </div>
          </div>
        )}

        <button disabled={pending} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl mt-8 disabled:opacity-50 transition-colors shadow-md">
          {pending ? "Menyimpan..." : "Simpan Produk"}
        </button>
      </form>
    </div>
  )
}
