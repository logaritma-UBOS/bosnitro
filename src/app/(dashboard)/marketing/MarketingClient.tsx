"use client"
import { useState } from "react"
import { createCampaign, updateCampaignStatus } from "@/actions/campaign"

export default function MarketingClient({ initialCampaigns, contentPlans, promos, isVip }: any) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    contentPlanId: "",
    targetSegment: "SEMUA",
    message: "",
    cta: "",
    promoId: "",
    linkUrl: "",
    status: "DRAFT"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await createCampaign(formData)
    if (res?.error) {
      alert(res.error)
    } else {
      window.location.reload()
    }
    setLoading(false)
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    const res = await updateCampaignStatus(id, status)
    if (res?.error) {
      alert(res.error)
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Engine */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-2">End-to-End Marketing Workflow</h2>
        <p className="text-blue-100 text-sm mb-4">Ubah konten menjadi transaksi nyata melalui WhatsApp Blast tersistem.</p>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="bg-white/20 px-3 py-1.5 rounded-full">1. Konten</span>
          <span>➔</span>
          <span className="bg-white/20 px-3 py-1.5 rounded-full">2. WA Blast</span>
          <span>➔</span>
          <span className="bg-white/20 px-3 py-1.5 rounded-full">3. Promo</span>
          <span>➔</span>
          <span className="bg-white/20 px-3 py-1.5 rounded-full">4. Transaksi (POS)</span>
          <span>➔</span>
          <span className="bg-white/20 px-3 py-1.5 rounded-full">5. Repeat Order</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">Daftar Campaign</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
        >
          {showForm ? "Batal" : "+ Buat Campaign"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nama Campaign *</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Promo Akhir Bulan" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Sumber Konten</label>
              <select value={formData.contentPlanId} onChange={e => setFormData({...formData, contentPlanId: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">(Tanpa Konten Terhubung)</option>
                {contentPlans.map((cp: any) => (
                  <option key={cp.id} value={cp.id}>{cp.title} ({cp.platform})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Target Customer Segment</label>
              <select value={formData.targetSegment} onChange={e => setFormData({...formData, targetSegment: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="SEMUA">Semua Pelanggan</option>
                <option value="BARU">Pelanggan BARU</option>
                <option value="AKTIF">Pelanggan AKTIF</option>
                <option value="LOYAL">Pelanggan LOYAL</option>
                <option value="BERISIKO">Pelanggan BERISIKO</option>
                <option value="TIDAK_AKTIF">Pelanggan TIDAK AKTIF</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Gunakan Promo</label>
              <select value={formData.promoId} onChange={e => setFormData({...formData, promoId: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">(Tanpa Promo)</option>
                {promos.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Pesan WhatsApp Blast</label>
            <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} rows={3} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Halo kak, ada promo spesial nih..." />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-sm transition-colors disabled:opacity-50">
            {loading ? "Menyimpan..." : "Simpan Campaign"}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {campaigns.map((c: any) => (
          <div key={c.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4 border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg text-gray-900">{c.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                    ${c.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' : ''}
                    ${c.status === 'SIAP_DIKIRIM' ? 'bg-blue-100 text-blue-700' : ''}
                    ${c.status === 'TERKIRIM' ? 'bg-indigo-100 text-indigo-700' : ''}
                    ${c.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-700' : ''}
                  `}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 max-w-2xl">{c.message}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs">
                  {c.contentPlan && <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">📱 Konten: {c.contentPlan.title}</span>}
                  {c.promo && <span className="bg-orange-50 text-orange-700 border border-orange-100 px-2 py-1 rounded">🎟️ Promo: {c.promo.code}</span>}
                  <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-1 rounded">🎯 Segment: {c.targetSegment}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 min-w-[120px]">
                {c.status === 'DRAFT' && <button onClick={() => handleUpdateStatus(c.id, 'SIAP_DIKIRIM')} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2 rounded-lg border border-blue-200">Tandai Siap</button>}
                {c.status === 'SIAP_DIKIRIM' && <button onClick={() => isVip ? handleUpdateStatus(c.id, 'TERKIRIM') : alert("Fitur Kirim WA Blast otomatis ini eksklusif untuk pengguna paket Pro Tahunan & Lifetime. Silakan upgrade paket Anda.")} className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2 rounded-lg border border-indigo-200">Kirim Blast WA</button>}
                {c.status === 'TERKIRIM' && <button onClick={() => handleUpdateStatus(c.id, 'SELESAI')} className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2 rounded-lg border border-emerald-200">Selesaikan</button>}
              </div>
            </div>
            
            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-500 font-bold mb-1">TARGET CUSTOMER</p>
                <p className="text-lg font-black text-gray-800">{c.metrics.targetCustomers}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <p className="text-[10px] text-emerald-700 font-bold mb-1">TRANSAKSI MASUK</p>
                <p className="text-lg font-black text-emerald-900">{c.metrics.transactions}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-[10px] text-blue-700 font-bold mb-1">OMZET CAMPAIGN</p>
                <p className="text-base font-black text-blue-900">Rp {c.metrics.omzet.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                <p className="text-[10px] text-orange-700 font-bold mb-1">PROMO TERPAKAI</p>
                <p className="text-lg font-black text-orange-900">{c.metrics.promoUsed}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <p className="text-[10px] text-purple-700 font-bold mb-1">UNIQUE CUSTOMERS</p>
                <p className="text-lg font-black text-purple-900">{c.metrics.uniqueCustomers}</p>
              </div>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && !showForm && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">Belum ada campaign marketing.</p>
          </div>
        )}
      </div>
    </div>
  )
}





