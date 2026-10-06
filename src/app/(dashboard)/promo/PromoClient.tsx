"use client"
import { formatNumber, formatRupiah } from '@/lib/format'

import { FormattedNumberInput } from '@/components/FormattedNumberInput'
import { useState } from "react"
import { createPromo, togglePromoActive } from "@/actions/promo"
import { useRouter } from "next/navigation"

export default function PromoClient({ initialPromos }: { initialPromos: any[] }) {
  const [promos, setPromos] = useState(initialPromos)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minimumPurchase: "",
    startAt: "",
    endAt: "",
    maxUsage: "",
    targetSegment: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.code || !formData.discountValue) {
      alert("Lengkapi data yang wajib")
      return
    }
    
    setLoading(true)
    const res = await createPromo(formData)
    setLoading(false)

    if (res.error) {
      alert(res.error)
    } else if (res.promo) {
      setPromos([res.promo, ...promos])
      setShowAddForm(false)
      setFormData({
        name: "",
        code: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        minimumPurchase: "",
        startAt: "",
        endAt: "",
        maxUsage: "",
        targetSegment: ""
      })
      router.refresh()
    }
  }

  const handleToggle = async (promoId: string, currentState: boolean) => {
    const res = await togglePromoActive(promoId, !currentState)
    if (res.success) {
      setPromos(promos.map(p => p.id === promoId ? { ...p, isActive: !currentState } : p))
      router.refresh()
    } else {
      alert(res.error || "Gagal mengubah status")
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Daftar Promo</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold">
          {showAddForm ? "Batal" : "+ Buat Promo Baru"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama Promo *</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kode Promo (Harus Unik) *</label>
              <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full border p-2 rounded-lg uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tipe Diskon</label>
              <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full border p-2 rounded-lg">
                <option value="PERCENTAGE">Persentase (%)</option>
                <option value="FIXED">Nominal (Rp)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nilai Diskon *</label>
              <FormattedNumberInput required min="0" value={formData.discountValue} onChangeValue={v => setFormData({...formData, discountValue: v.toString()})} className="w-full border p-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Minimum Pembelian (Rp)</label>
              <FormattedNumberInput min="0" value={formData.minimumPurchase} onChangeValue={v => setFormData({...formData, minimumPurchase: v.toString()})} className="w-full border p-2 rounded-lg" placeholder="Opsional" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Maksimal Penggunaan</label>
              <FormattedNumberInput min="1" value={formData.maxUsage} onChangeValue={v => setFormData({...formData, maxUsage: v.toString()})} className="w-full border p-2 rounded-lg" placeholder="Opsional" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mulai Tanggal</label>
              <input type="date" value={formData.startAt} onChange={e => setFormData({...formData, startAt: e.target.value})} className="w-full border p-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Sampai Tanggal</label>
              <input type="date" value={formData.endAt} onChange={e => setFormData({...formData, endAt: e.target.value})} className="w-full border p-2 rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Target Audience (Marketing Segment)</label>
              <select value={formData.targetSegment} onChange={e => setFormData({...formData, targetSegment: e.target.value})} className="w-full border p-2 rounded-lg">
                <option value="">Semua Pelanggan (Public)</option>
                <option value="BARU">BARU (Pelanggan Baru)</option>
                <option value="AKTIF">AKTIF (Pelanggan Rutin)</option>
                <option value="LOYAL">LOYAL (Pelanggan Setia)</option>
                <option value="BERISIKO">BERISIKO (Mulai Pasif)</option>
                <option value="TIDAK_AKTIF">TIDAK AKTIF (Churned)</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
            {loading ? "Menyimpan..." : "Simpan Promo"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-100">
              <tr>
                <th className="p-4">Kode Promo</th>
                <th className="p-4">Diskon</th>
                <th className="p-4">Syarat & Target</th>
                <th className="p-4">Usage</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">Belum ada promo.</td>
                </tr>
              ) : (
                promos.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{p.code}</p>
                      <p className="text-xs text-gray-500">{p.name}</p>
                    </td>
                    <td className="p-4 font-bold text-green-600">
                      {p.discountType === "PERCENTAGE"
                        ? `${p.discountValue}%`
                        : `${formatRupiah(p.discountValue)}`}
                    </td>
                    <td className="p-4 text-xs">
                      {p.minimumPurchase ? <div>Min: {formatRupiah(p.minimumPurchase)}</div> : null}
                      {p.targetSegment ? <div>Segmen: <span className="font-bold">{p.targetSegment}</span></div> : <div>Segmen: Semua</div>}
                      {p.startAt && p.endAt ? <div>Periode: {new Date(p.startAt).toLocaleDateString("id-ID")} - {new Date(p.endAt).toLocaleDateString("id-ID")}</div> : null}
                    </td>
                    <td className="p-4">
                      {p.usageCount}{p.maxUsage ? ` / ${p.maxUsage}` : " kali"}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggle(p.id, p.isActive)}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {p.isActive ? "AKTIF" : "NONAKTIF"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}