"use client"

import { useState } from "react"
import { addSupplier, recordStockMovement, recordBulkStockMovement } from "@/actions/inventory"
import { useRouter, useSearchParams } from "next/navigation"

export default function StokClient({ products, ingredients, suppliers, movements }: any) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const autoOpenItemId = searchParams.get("addId")
  const autoOpenItemType = searchParams.get("type") // "PRODUCT" or "INGREDIENT"

  const [activeTab, setActiveTab] = useState<"RIWAYAT" | "SUPPLIER">("RIWAYAT")
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(!!autoOpenItemId)
  
  // Stock Form State
  const [stockType, setStockType] = useState<"IN" | "OUT" | "RETURN">("IN")
  const [stockItemType, setStockItemType] = useState<"PRODUCT" | "INGREDIENT">(autoOpenItemType as any || "PRODUCT")
  
  const [supplierId, setSupplierId] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Bulk Quantities State: key is itemId, value is quantity
  const [bulkQuantities, setBulkQuantities] = useState<Record<string, number>>(
    autoOpenItemId ? { [autoOpenItemId]: 0 } : {}
  )

  const handleQuantityChange = (id: string, val: string) => {
    const num = parseFloat(val);
    setBulkQuantities(prev => ({
      ...prev,
      [id]: isNaN(num) ? 0 : num
    }))
  }

  // Supplier Form State
  const [supplierName, setSupplierName] = useState("")
  const [supplierPhone, setSupplierPhone] = useState("")
  const [supplierAddress, setSupplierAddress] = useState("")

  const handleSaveSupplier = async () => {
    if (!supplierName) return alert("Nama supplier wajib diisi")
    setIsSubmitting(true)
    const res = await addSupplier({ name: supplierName, phone: supplierPhone, address: supplierAddress })
    if (res.error) alert(res.error)
    else {
      setShowSupplierModal(false)
      setSupplierName("")
      setSupplierPhone("")
      setSupplierAddress("")
      router.refresh()
    }
    setIsSubmitting(false)
  }

  const handleSaveStock = async () => {
    if (stockType === "RETURN" && !supplierId) return alert("Retur stok wajib memilih Supplier")

    const itemsToSubmit = Object.entries(bulkQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({
        productId: stockItemType === "PRODUCT" ? id : undefined,
        ingredientId: stockItemType === "INGREDIENT" ? id : undefined,
        quantity: qty
      }))

    if (itemsToSubmit.length === 0) return alert("Pilih minimal satu barang dan isi jumlahnya > 0")

    setIsSubmitting(true)
    const res = await recordBulkStockMovement({
      type: stockType,
      items: itemsToSubmit,
      supplierId: supplierId || undefined,
      notes
    })

    if (res.error) alert(res.error)
    else {
      setShowStockModal(false)
      setBulkQuantities({})
      setNotes("")
      router.push("/stok")
    }
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 max-w-7xl mx-auto">
      <div className="bg-white px-4 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Stok & Supplier</h1>
          <p className="text-sm text-gray-500">Pencatatan keluar masuk barang & retur</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <button 
            onClick={() => setShowStockModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm"
          >
            + Transaksi Stok
          </button>
        </div>
      </div>

      <div className="px-4 lg:px-8 mt-6">
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <button 
            className={`pb-3 text-sm font-bold border-b-2 px-1 ${activeTab === "RIWAYAT" ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            onClick={() => setActiveTab("RIWAYAT")}
          >
            Riwayat Stok
          </button>
          <button 
            className={`pb-3 text-sm font-bold border-b-2 px-1 ${activeTab === "SUPPLIER" ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            onClick={() => setActiveTab("SUPPLIER")}
          >
            Data Supplier
          </button>
        </div>

        {activeTab === "RIWAYAT" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Tipe</th>
                    <th className="p-4">Item</th>
                    <th className="p-4">Jumlah</th>
                    <th className="p-4">Supplier</th>
                    <th className="p-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movements.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400">Belum ada riwayat transaksi stok</td></tr>
                  ) : movements.map((m: any) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="p-4 whitespace-nowrap text-gray-600">
                        {new Date(m.date).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4">
                        {m.type === "IN" && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">MASUK</span>}
                        {m.type === "OUT" && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-[10px] font-bold">KELUAR</span>}
                        {m.type === "RETURN" && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold">RETUR</span>}
                        {m.type === "SALE" && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold">TERJUAL</span>}
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        {m.product?.name || m.ingredient?.name}
                      </td>
                      <td className="p-4 font-bold">
                        {m.type === "IN" ? "+" : "-"}{m.quantity} <span className="text-xs font-normal text-gray-500">{m.ingredient?.unit || "unit"}</span>
                      </td>
                      <td className="p-4 text-gray-600">{m.supplier?.name || "-"}</td>
                      <td className="p-4 text-gray-500 truncate max-w-[200px]">{m.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "SUPPLIER" && (
          <div>
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setShowSupplierModal(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
              >
                + Tambah Supplier
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.length === 0 ? (
                <div className="col-span-full p-8 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">Belum ada data supplier</div>
              ) : suppliers.map((s: any) => (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{s.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">📞 {s.phone || "Tidak ada nomor HP"}</p>
                  <p className="text-xs text-gray-400">📍 {s.address || "Alamat tidak diisi"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL TRANSAKSI STOK */}
      {showStockModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm pb-[80px]">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
              <h2 className="font-bold text-lg text-gray-900">Catat Transaksi Stok</h2>
              <button onClick={() => setShowStockModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-4 md:p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl">
                <button 
                  onClick={() => setStockType("IN")}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors ${stockType === "IN" ? "bg-white text-green-600 shadow" : "text-gray-500 hover:bg-gray-200"}`}
                >
                  Masuk / Restock
                </button>
                <button 
                  onClick={() => setStockType("OUT")}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors ${stockType === "OUT" ? "bg-white text-orange-600 shadow" : "text-gray-500 hover:bg-gray-200"}`}
                >
                  Kurangi / Buang
                </button>
                <button 
                  onClick={() => setStockType("RETURN")}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors ${stockType === "RETURN" ? "bg-white text-red-600 shadow" : "text-gray-500 hover:bg-gray-200"}`}
                >
                  Retur ke Supplier
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilih Supplier (Opsional / Filter)</label>
                <select value={supplierId} onChange={e => {
                  setSupplierId(e.target.value);
                  setBulkQuantities({});
                }} className="w-full border-gray-200 rounded-xl bg-gray-50 py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm">
                  <option value="">-- Semua Supplier / Tanpa Supplier --</option>
                  {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input type="radio" checked={stockItemType === "PRODUCT"} onChange={() => setStockItemType("PRODUCT")} className="text-emerald-600 focus:ring-emerald-500" />
                  Barang Jadi (Retail)
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input type="radio" checked={stockItemType === "INGREDIENT"} onChange={() => setStockItemType("INGREDIENT")} className="text-emerald-600 focus:ring-emerald-500" />
                  Bahan Baku Mentah
                </label>
              </div>

              
                <div className="space-y-3 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                  <div className="flex flex-col gap-2 px-2 pt-1 mb-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Daftar Barang (Isi Jumlahnya)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Cari produk/bahan..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                {(stockItemType === "PRODUCT" ? products : ingredients)
                  .filter((item: any) => (!supplierId || item.supplierId === supplierId) && (!searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())))
                  .map((item: any) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden relative flex-shrink-0">
                            <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {stockItemType === "PRODUCT" ? `Stok: ${item.currentStock || 0} • Rp ${item.sellPrice.toLocaleString('id-ID')}` : `Stok: ${item.currentStock} ${item.unit}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button"
                          onClick={() => handleQuantityChange(item.id, String(Math.max(0, (bulkQuantities[item.id] || 0) - 1)))}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-bold"
                        >-</button>
                        <input 
                          type="number" 
                          min="0" 
                          value={bulkQuantities[item.id] || ""} 
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          className="w-14 text-center text-sm font-bold border border-gray-200 rounded-lg py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="0"
                        />
                        <button type="button"
                          onClick={() => handleQuantityChange(item.id, String((bulkQuantities[item.id] || 0) + 1))}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-bold"
                        >+</button>
                      </div>
                    </div>
                ))}
                
                {(stockItemType === "PRODUCT" ? products : ingredients).filter((item: any) => (!supplierId || item.supplierId === supplierId) && (!searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">Tidak ada barang untuk kategori/supplier ini.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Catatan</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border-gray-200 rounded-xl bg-gray-50 py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm" placeholder="Alasan retur, nomor PO, dll" rows={2}></textarea>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setShowStockModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-200 transition-colors">Batal</button>
              <button onClick={handleSaveStock} disabled={isSubmitting} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH SUPPLIER */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm pb-[80px]">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
              <h2 className="font-bold text-lg text-gray-900">Tambah Supplier Baru</h2>
              <button onClick={() => setShowSupplierModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Supplier / Pabrik *</label>
                <input type="text" value={supplierName} onChange={e => setSupplierName(e.target.value)} className="w-full border-gray-200 rounded-xl bg-gray-50 py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm" placeholder="PT XYZ Makmur" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nomor Telepon / WA</label>
                <input type="text" value={supplierPhone} onChange={e => setSupplierPhone(e.target.value)} className="w-full border-gray-200 rounded-xl bg-gray-50 py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm" placeholder="081..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Alamat Lengkap</label>
                <textarea value={supplierAddress} onChange={e => setSupplierAddress(e.target.value)} className="w-full border-gray-200 rounded-xl bg-gray-50 py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm" rows={2}></textarea>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setShowSupplierModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-200 transition-colors">Batal</button>
              <button onClick={handleSaveSupplier} disabled={isSubmitting} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-black transition-colors disabled:opacity-50">
                {isSubmitting ? "Menyimpan..." : "Simpan Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
