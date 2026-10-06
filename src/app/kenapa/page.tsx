import { formatNumber, formatRupiah } from '@/lib/format';
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { redirect } from "next/navigation"
import { runLogaritmaEngine } from "@/lib/engines/logaritmaEngine"

export const dynamic = "force-dynamic"

export default async function KenapaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  if (!business) redirect("/")

  const {
    targetHarian,
    sudahMasuk,
    masihKurang,
    butuhTransaksiSisa,
    aovAktual
  } = await runLogaritmaEngine(business.id)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto pb-10">
      <div className="bg-gray-900 text-white p-4 pb-6 shrink-0">
        <Link href="/" className="text-gray-300 text-sm font-semibold mb-4 inline-block">← Kembali</Link>
        <h1 className="text-xl font-bold">Penjelasan Angka</h1>
      </div>
      
      <div className="p-4 space-y-4 -mt-2">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-bold text-gray-900 mb-2">Kenapa masih kurang {formatRupiah(masihKurang)}?</p>
          <ul className="text-sm text-gray-600 space-y-2 ml-4 list-disc">
            <li>Target harian toko Anda adalah <b>{formatRupiah(targetHarian)}</b>.</li>
            <li>Hari ini, uang yang sudah masuk ke kasir baru <b>{formatRupiah(sudahMasuk)}</b>.</li>
            <li>Jika dikurangkan, target Anda masih kurang <b>{formatRupiah(masihKurang)}</b>.</li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-bold text-gray-900 mb-2">Kenapa butuh {butuhTransaksiSisa} transaksi lagi?</p>
          <ul className="text-sm text-gray-600 space-y-2 ml-4 list-disc">
            <li>Berdasarkan catatan kasir, rata-rata satu pelanggan Anda menghabiskan <b>{formatRupiah(aovAktual)}</b> hari ini.</li>
            <li>Untuk mengejar kekurangan {formatRupiah(masihKurang)}, Anda membutuhkan sekitar <b>{butuhTransaksiSisa} orang pelanggan lagi</b> yang belanja dengan rata-rata nominal tersebut.</li>
            <li>Ini disebut dengan teknik hitung mundur <i>(Backward Mapping)</i> UBOS.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
