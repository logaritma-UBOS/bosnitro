"use client"

import { useState, useEffect } from "react"
import { getStaffList, createStaff, deleteStaff } from "@/actions/staff"
import { Plus, Trash2, Users, ShieldCheck, UserCheck, X } from "lucide-react"

export default function PegawaiClient() {
  const [staffs, setStaffs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState("")
  const [submitLoading, setSubmitLoading] = useState(false)

  const loadStaffs = async () => {
    try {
      const data = await getStaffList()
      setStaffs(data)
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaffs()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitLoading(true)
    setError("")
    const formData = new FormData(e.currentTarget)
    try {
      await createStaff(formData)
      setShowModal(false)
      loadStaffs()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pegawai ini?")) return
    try {
      await deleteStaff(id)
      loadStaffs()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Memuat data pegawai...</div>

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Manajemen Pegawai & Hak Akses</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Buat akun kasir atau manajer dengan pembatasan hak akses sistem interlocking & POS
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Pegawai
        </button>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-orange-900 text-sm">Hak Akses: KASIR</h3>
          </div>
          <p className="text-xs text-orange-800 mt-1">
            Hanya dapat mengakses transaksi <b>Kasir POS</b> (foto plat/botol & pemicu solenoid) dan melakukan <b>Tutup Shift (Blind Closing)</b>. Katalog, laporan finansial, dan dashboard Owner terkunci rapat.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-blue-900 text-sm">Hak Akses: MANAGER</h3>
          </div>
          <p className="text-xs text-blue-800 mt-1">
            Dapat mengakses <b>Kasir POS</b>, <b>Katalog & Timer</b> (atur harga, stok, timer solenoid), <b>Tutup Shift</b> (termasuk audit selisih), dan <b>Riwayat Transaksi</b>. Laporan finansial Owner tetap terkunci.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        {staffs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Belum ada pegawai yang didaftarkan.</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600 min-w-[600px]">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nama Pegawai</th>
                <th className="px-6 py-4">Email Login</th>
                <th className="px-6 py-4">Jabatan (Role)</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffs.map(staff => (
                <tr key={staff.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{staff.name}</td>
                  <td className="px-6 py-4">{staff.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${staff.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(staff.id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">Tambah Pegawai Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input name="name" required className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500" placeholder="Budi Kasir" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email Login</label>
                  <input name="email" type="email" required className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500" placeholder="budi@warungku.com" />
                  <p className="text-xs text-slate-500 mt-1">Email ini akan digunakan oleh pegawai untuk login ke UBOS.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Password Sementara</label>
                  <input name="password" type="text" required className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500" placeholder="rahasia123" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Pilih Jabatan (Role)</label>
                  <select name="role" required className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500">
                    <option value="KASIR">Kasir (Hanya akses transaksi POS & Tutup Shift)</option>
                    <option value="MANAGER">Manager (Akses POS, Katalog & Stok, Tutup Shift, & Riwayat)</option>
                  </select>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  type="submit" 
                  disabled={submitLoading}
                  className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitLoading ? "Menyimpan..." : "Simpan Pegawai"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
