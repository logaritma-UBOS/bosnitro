import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FormattedNumberInput } from '@/components/FormattedNumberInput'
import { updateMonthlyTarget } from "@/actions/settings"

export const dynamic = "force-dynamic"

export default async function TargetSettingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({
    where: whereClause,
    include: { goals: true }
  })
  if (!business) redirect("/")
  
  const monthlyTarget = business.goals.find(g => g.period === "MONTHLY")?.targetOmzet || 0

  return (
    <div className="min-h-screen bg-gray-50 pb-24 max-w-md mx-auto">
      <div className="bg-primary-700 text-white p-4 pb-6 rounded-b-3xl">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-white/80 text-sm font-medium hover:text-white transition-colors">← Beranda</Link>
          <h1 className="text-lg font-bold">Pengaturan Target</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="p-4 mt-4">
        <form action={updateMonthlyTarget} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Target Omzet Bulanan (Rp)</label>
            <FormattedNumberInput name="targetOmzet" 
              defaultValue={monthlyTarget} 
              required
              min="0"
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900" 
            />
            <p className="text-xs text-gray-500 mt-2">Target harian akan dikalkulasi otomatis berdasarkan hari operasional bisnis Anda (Target Bulanan dibagi estimasi hari buka).</p>
          </div>
          <button type="submit" className="w-full bg-primary-700 text-white font-bold py-3 rounded-xl hover:bg-primary-800 transition-colors">
            Simpan Target
          </button>
        </form>
      </div>
    </div>
  )
}
