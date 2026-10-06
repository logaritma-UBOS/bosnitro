import { formatNumber, formatRupiah } from '@/lib/format';
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { redirect } from "next/navigation"
import { deleteExpense } from "@/actions/finance"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

export default async function PengeluaranPage() {
  const session = await auth()
  const plan = "Pro"
  if (!session?.user?.id) redirect("/login")
  if (session.user.role === "KASIR") redirect("/kasir")
  
  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  if (!business) redirect("/")

  const expenses = await prisma.expense.findMany({
    where: { businessId: business.id },
    orderBy: { date: "desc" }
  })

  // Menghitung KPI sederhana
  const totalPengeluaran = expenses.reduce((sum, e) => sum + e.amount, 0)
  const averageHarian = expenses.length > 0 ? totalPengeluaran / new Date().getDate() : 0 // Anggap bulan berjalan

  return (
        <div className="min-h-screen bg-slate-50 pb-16">
      {/* --- DESKTOP HEADER --- */}
      <div className="hidden md:block bg-white border-b border-slate-200 px-4 lg:px-8 py-4 mb-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1">
              &larr; Kembali ke Beranda
            </Link>
            <h1 className="text-xl font-bold text-slate-900">Pengeluaran</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/pengeluaran/tambah" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-bold rounded-lg shadow-sm transition-colors">
              + Catat Pengeluaran
            </Link>
          </div>
        </div>
      </div>

      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden bg-red-700 text-white p-4 pb-6 shrink-0 rounded-b-3xl">
        <div className="flex justify-between items-center mb-2">
          <Link href="/" className="text-white text-sm font-semibold">&larr; Beranda</Link>
          <Link href="/pengeluaran/tambah" className="bg-white text-red-700 px-3 py-1 text-sm font-bold rounded-full">+ Catat</Link>
        </div>
        <h1 className="text-xl font-bold">Pengeluaran</h1>
      </div>
      
      {/* --- CONTENT CONTAINER --- */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 mt-4 md:mt-0 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* KOLOM KIRI (KPI) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-bold text-slate-500 mb-4">Ringkasan Bulan Ini</h2>
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-1">Total Pengeluaran</p>
                <p className="text-3xl font-bold text-red-600">{formatRupiah(totalPengeluaran)}</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-1">Rata-rata Harian</p>
                <p className="text-lg font-bold text-slate-800">{formatRupiah(averageHarian)}</p>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN (LIST) */}
          <div className="lg:col-span-8 space-y-3">
            {expenses.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <p className="text-slate-500 mb-4">Belum ada catatan pengeluaran.</p>
                <Link href="/pengeluaran/tambah" className="inline-block bg-red-600 text-white px-4 py-2 text-sm font-bold rounded-lg hover:bg-red-700 transition-colors">
                  + Catat Pengeluaran Pertama
                </Link>
              </div>
            ) : (
              expenses.map(exp => (
                <div key={exp.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center hover:border-red-200 transition-colors">
                  <div>
                    <p className="font-bold text-slate-900">{exp.category}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(exp.date).toLocaleDateString('id-ID')} &bull; {exp.description || 'Tidak ada catatan'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{formatRupiah(exp.amount)}</p>
                    <form action={async () => {
                      "use server"
                      try {
                        await prisma.expense.delete({ where: { id: exp.id } })
                      } catch(e){}
                      revalidatePath("/pengeluaran")
                    }}>
                      <button type="submit" className="text-red-400 hover:text-red-600 text-xs font-bold mt-1.5 transition-colors">Hapus</button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
      )
}
