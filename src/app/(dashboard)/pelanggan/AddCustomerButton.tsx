"use client"
import { useState } from "react"
import { quickAddCustomer } from "@/actions/customer"
import { useRouter } from "next/navigation"

export default function AddCustomerButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return alert("Nama pelanggan harus diisi")
    setIsSubmitting(true)
    try {
      const res = await quickAddCustomer(name, phone)
      if (res.error) {
        alert(res.error)
      } else {
        setIsOpen(false)
        setName("")
        setPhone("")
        router.refresh()
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem")
    }
    setIsSubmitting(false)
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm">
        + Pelanggan Baru
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Tambah Pelanggan Baru</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="Contoh: Budi Santoso"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp (Opsional)</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="Contoh: 0812..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-lg text-sm">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg text-sm disabled:opacity-50">
                  {isSubmitting ? "Menyimpan..." : "Simpan & Pilih"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}