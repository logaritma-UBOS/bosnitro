"use client"
import { useState } from "react"
import { bulkAssignSupplier } from "@/actions/catalog"
import { useRouter } from "next/navigation"

export default function BulkSupplierModal({ 
  onClose, 
  products, 
  ingredients, 
  suppliers 
}: { 
  onClose: () => void, 
  products: any[], 
  ingredients: any[], 
  suppliers: any[] 
}) {
  const router = useRouter()
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [selectedType, setSelectedType] = useState<'PRODUCT'|'INGREDIENT'>('PRODUCT')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const activeItems = selectedType === 'PRODUCT' ? products : ingredients

  const filteredItems = activeItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newIds = new Set([...selectedIds, ...filteredItems.map(i => i.id)]);
      setSelectedIds(Array.from(newIds));
    } else {
      const filteredIds = new Set(filteredItems.map(i => i.id));
      setSelectedIds(selectedIds.filter(id => !filteredIds.has(id)));
    }
  }

  const handleToggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSave = async () => {
    if (!selectedSupplier) {
      alert("Silakan pilih supplier (atau pilih Kosongkan)")
      return
    }
    if (selectedIds.length === 0) {
      alert("Silakan pilih minimal 1 barang")
      return
    }

    setIsSubmitting(true)
    const val = selectedSupplier === 'NONE' ? "" : selectedSupplier
    const res = await bulkAssignSupplier(val, selectedIds, selectedType)

    if (res.error) {
      setIsSubmitting(false)
      alert(res.error)
    } else {
      // Beri waktu 1.5 detik agar database replica Turso tersinkronisasi
      // sebelum me-refresh tampilan UI
      setTimeout(() => {
        router.refresh()
        onClose()
      }, 1500)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm pb-[80px]">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <h2 className="font-bold text-lg text-gray-900">Atur Supplier Sekaligus</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-4 md:p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilih Supplier yang akan dipasang</label>
            <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} className="w-full border-gray-200 rounded-xl bg-gray-50 py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm font-semibold text-emerald-800">
              <option value="">-- Pilih Supplier --</option>
              <option value="NONE">-- ❌ Kosongkan / Tanpa Supplier --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input type="radio" checked={selectedType === "PRODUCT"} onChange={() => { setSelectedType("PRODUCT"); setSelectedIds([]); }} className="text-emerald-600 focus:ring-emerald-500" />
              Barang Jadi (Retail)
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input type="radio" checked={selectedType === "INGREDIENT"} onChange={() => { setSelectedType("INGREDIENT"); setSelectedIds([]); }} className="text-emerald-600 focus:ring-emerald-500" />
              Bahan Baku Mentah
            </label>
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50">
            <div className="p-3 border-b border-gray-100 bg-white">
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari produk atau bahan..." 
                  className="w-full border border-gray-200 rounded-lg py-2 px-3 pl-9 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            
            <div className="p-3 border-b border-gray-100 flex gap-3 items-center bg-gray-100/50">
              <input type="checkbox" onChange={handleSelectAll} checked={filteredItems.length > 0 && filteredItems.every(item => selectedIds.includes(item.id))} className="rounded text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm font-bold text-gray-700">Pilih Semua ({filteredItems.length})</span>
            </div>
            
            <div className="max-h-[30vh] overflow-y-auto divide-y divide-gray-100">
              {filteredItems.map(item => {
                const currentSupplier = suppliers.find(s => s.id === item.supplierId)
                return (
                  <label key={item.id} className="flex gap-3 items-center p-3 hover:bg-white cursor-pointer transition-colors">
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleToggle(item.id)} className="rounded text-emerald-600 focus:ring-emerald-500 shrink-0" />
                    <div className="flex-1 flex gap-3 items-center min-w-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100 bg-gray-50" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 truncate">Supplier saat ini: {currentSupplier ? currentSupplier.name : 'Kosong'}</p>
                      </div>
                    </div>
                  </label>
                )
              })}
              {filteredItems.length === 0 && (
                <div className="p-4 text-center text-xs text-gray-400">
                  {searchQuery ? "Tidak ditemukan." : "Belum ada barang di kategori ini."}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-200 transition-colors">Batal</button>
          <button onClick={handleSave} disabled={isSubmitting || !selectedSupplier || selectedIds.length === 0} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {isSubmitting ? "Menyimpan..." : "Terapkan Supplier"}
          </button>
        </div>
      </div>
    </div>
  )
}
