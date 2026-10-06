"use client"
import { useState, useActionState } from "react"
import { createContentPlan, updateContentPlan, deleteContentPlan } from "@/actions/content"

export default function ContentClient({ initialPlans }: { initialPlans: any[] }) {
  const [plans, setPlans] = useState(initialPlans)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    platform: "TIKTOK",
    status: "DRAFT",
    cta: "",
    targetUrl: "",
    postDate: "",
    notes: ""
  })
  
  const [loading, setLoading] = useState(false)

  const handleEdit = (plan: any) => {
    setFormData({
      title: plan.title,
      platform: plan.platform,
      status: plan.status,
      cta: plan.cta || "",
      targetUrl: plan.targetUrl || "",
      postDate: plan.postDate ? new Date(plan.postDate).toISOString().split('T')[0] : "",
      notes: plan.notes || ""
    })
    setEditingId(plan.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus rencana konten ini?")) return
    await deleteContentPlan(id)
    setPlans(plans.filter(p => p.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    let res;
    if (editingId) {
      res = await updateContentPlan(editingId, formData)
    } else {
      res = await createContentPlan(formData)
    }
    
    if (res?.error) {
      alert(res.error)
    } else {
      window.location.reload()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Template Guide */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
        <h2 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
          <span>ℹ️</span> Template Traffic UBOS
        </h2>
        <p className="text-sm text-emerald-700 mb-4">
          Gunakan alur sederhana ini untuk mengubah viewers menjadi pembeli:
        </p>
        <div className="flex flex-col md:flex-row gap-3 items-center text-center text-sm font-medium text-emerald-900">
          <div className="bg-white px-4 py-2 rounded-lg border border-emerald-200 w-full md:w-auto shadow-sm">1. Konten (Hook)</div>
          <span className="text-emerald-400 hidden md:block">→</span>
          <span className="text-emerald-400 md:hidden">↓</span>
          <div className="bg-white px-4 py-2 rounded-lg border border-emerald-200 w-full md:w-auto shadow-sm">2. Call to Action</div>
          <span className="text-emerald-400 hidden md:block">→</span>
          <span className="text-emerald-400 md:hidden">↓</span>
          <div className="bg-white px-4 py-2 rounded-lg border border-emerald-200 w-full md:w-auto shadow-sm">3. Link WhatsApp</div>
          <span className="text-emerald-400 hidden md:block">→</span>
          <span className="text-emerald-400 md:hidden">↓</span>
          <div className="bg-white px-4 py-2 rounded-lg border border-emerald-200 w-full md:w-auto shadow-sm">4. Closing (Kasir)</div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">Daftar Rencana Konten</h2>
        <button 
          onClick={() => {
            setFormData({ title: "", platform: "TIKTOK", status: "DRAFT", cta: "", targetUrl: "", postDate: "", notes: "" })
            setEditingId(null)
            setShowForm(!showForm)
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
        >
          {showForm ? "Batal" : "+ Buat Rencana"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Judul / Ide Konten *</label>
            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Misal: Review Nasi Goreng Spesial" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Platform</label>
              <select value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value="TIKTOK">TikTok</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="WHATSAPP_STATUS">WhatsApp Status</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value="DRAFT">Ide / Draft</option>
                <option value="SIAP_POSTING">Siap Posting</option>
                <option value="SUDAH_POSTING">Sudah Posting</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Call to Action (CTA)</label>
              <input type="text" value={formData.cta} onChange={e => setFormData({...formData, cta: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Misal: Klik link di bio untuk order" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Link / Nomor WhatsApp Tujuan</label>
              <input type="text" value={formData.targetUrl} onChange={e => setFormData({...formData, targetUrl: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="wa.me/628..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Rencana Tanggal Posting</label>
              <input type="date" value={formData.postDate} onChange={e => setFormData({...formData, postDate: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Catatan Tambahan</label>
            <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Angle video, hook, sound yang dipakai..." />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-sm transition-colors disabled:opacity-50">
            {loading ? "Menyimpan..." : "Simpan Rencana"}
          </button>
        </form>
      )}

      {plans.length === 0 && !showForm && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">Belum ada rencana konten.</p>
        </div>
      )}

      <div className="grid gap-4">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold 
                  ${plan.platform === 'TIKTOK' ? 'bg-black text-white' : ''}
                  ${plan.platform === 'INSTAGRAM' ? 'bg-pink-100 text-pink-700' : ''}
                  ${plan.platform === 'FACEBOOK' ? 'bg-blue-100 text-blue-700' : ''}
                  ${plan.platform === 'WHATSAPP_STATUS' ? 'bg-green-100 text-green-700' : ''}
                `}>
                  {plan.platform}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                  ${plan.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' : ''}
                  ${plan.status === 'SIAP_POSTING' ? 'bg-blue-100 text-blue-700' : ''}
                  ${plan.status === 'SUDAH_POSTING' ? 'bg-emerald-100 text-emerald-700' : ''}
                `}>
                  {plan.status.replace('_', ' ')}
                </span>
                {plan.postDate && (
                  <span className="text-[10px] text-gray-500 font-medium">📅 {new Date(plan.postDate).toLocaleDateString('id-ID')}</span>
                )}
              </div>
              <h3 className="font-bold text-gray-900">{plan.title}</h3>
              {plan.cta && <p className="text-xs text-gray-600 mt-1"><span className="font-semibold text-gray-700">CTA:</span> {plan.cta}</p>}
              {plan.targetUrl && <p className="text-xs text-blue-600 mt-0.5 break-all">🔗 {plan.targetUrl}</p>}
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => handleEdit(plan)} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors">Edit</button>
              <button onClick={() => handleDelete(plan.id)} className="px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors">Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}