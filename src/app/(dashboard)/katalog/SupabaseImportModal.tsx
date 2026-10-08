"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { importProductsFromSupabase } from './actions'

export default function SupabaseImportModal({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [table, setTable] = useState('products')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleImport = async () => {
    if (!url || !key || !table) return setError('Semua kolom wajib diisi')
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await importProductsFromSupabase({ url, key, table })
      if (res.error) throw new Error(res.error)
      setSuccess(`Berhasil mengimpor ${res.count} produk dari Supabase!`)
      setTimeout(() => {
        onClose()
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Import dari Supabase</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Tarik otomatis data produk ritel / konsinyasi dari database Supabase Anda langsung ke UBOS.</p>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Supabase Project URL</label>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xyz.supabase.co" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Supabase API Key (anon/public)</label>
            <input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1..." className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nama Tabel Produk</label>
            <input type="text" value={table} onChange={e => setTable(e.target.value)} placeholder="products" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>

          {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-100">{error}</div>}
          {success && <div className="p-3 bg-emerald-50 text-emerald-600 text-sm font-semibold rounded-lg border border-emerald-100">{success}</div>}

          <div className="pt-2">
            <button onClick={handleImport} disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Menarik Data...
                </>
              ) : "Mulai Import Otomatis"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
