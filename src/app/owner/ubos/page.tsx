import { authorizeOwner } from "@/actions/ownerAuth"
import { prisma } from "@/lib/prisma"
import { OwnerMetricCard, OwnerDataConfidence } from "@/components/owner/OwnerComponents"
import { formatNumber } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function OwnerUbosPage() {
  await authorizeOwner().catch(() => {})

  const totalBusinesses = await prisma.business.count()
  const activeBusinesses = await prisma.business.count({ where: { status: "ACTIVE" } })
  const totalSales = await prisma.sale.count()
  const totalRecommendations = await prisma.recommendation.count()

  const recentBusinesses = await prisma.business.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      _count: {
        select: { sales: true, recommendations: true }
      }
    }
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">UBOS Monitoring</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <OwnerMetricCard title="Total Mitra (Terdaftar)" value={totalBusinesses} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
        <OwnerMetricCard title="Toko Aktif" value={activeBusinesses} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
        <OwnerMetricCard title="Aktivitas Transaksi" value={totalSales} subtitle="Total Nota POS" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} />
        <OwnerMetricCard title="Saran Tindakan" value={totalRecommendations} subtitle="Insights Siap Jalan" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Recent Onboarded Businesses</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">Business Name</th>
                <th className="px-6 py-3">Owner</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Sales</th>
                <th className="px-6 py-3 text-right">Recommendations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentBusinesses.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{b.name}</td>
                  <td className="px-6 py-4 text-slate-600">{b.user.name}</td>
                  <td className="px-6 py-4 text-slate-600">{b.businessType}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${b.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600 font-mono">{formatNumber(b._count.sales)}</td>
                  <td className="px-6 py-4 text-right text-slate-600 font-mono">{formatNumber(b._count.recommendations)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentBusinesses.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">No businesses found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
