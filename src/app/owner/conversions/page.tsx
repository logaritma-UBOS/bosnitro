import { authorizeOwner } from "@/actions/ownerAuth"
import { OwnerUnavailableState } from "@/components/owner/OwnerComponents"

export const dynamic = "force-dynamic"

export default async function OwnerCONVERSIONSPage() {
  await authorizeOwner().catch(() => {})

  return (
    <div className="space-y-6 max-w-4xl mx-auto pt-10">
      <h1 className="text-2xl font-bold text-slate-900 capitalize">conversions Monitoring</h1>
      <OwnerUnavailableState 
        title="Data Not Found"
        message="Data required for this Logaritma.id module (conversions) is not yet available in the existing Prisma schema or engine."
      />
    </div>
  )
}
