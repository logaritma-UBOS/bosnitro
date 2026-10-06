import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import PublicStoreClient from "./PublicStoreClient"

export const dynamic = "force-dynamic"

export default async function TokoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const settings = await prisma.businessSetting.findFirst({
    where: { storeSlug: slug },
    include: { 
      business: {
        include: {
          user: { select: { image: true } }
        }
      } 
    }
  })

  if (!settings || !settings.business) notFound()

  // Find active products for this business
  const products = await prisma.product.findMany({
    where: {
      businessId: settings.businessId,
      isActive: true,
      showInStore: true
    },
    orderBy: { name: 'asc' }
  })

  // Find categories for grouping
  const categories = await prisma.productCategory.findMany({
    where: { businessId: settings.businessId },
    orderBy: { name: 'asc' }
  })

  // Find promos for this business
  const promos = await prisma.promo.findMany({
    where: { businessId: settings.businessId, isActive: true },
    orderBy: { startAt: 'desc' }
  })

  return (
    <PublicStoreClient 
      business={settings.business}
      settings={settings}
      products={products}
      categories={categories}
      promos={promos}
    />
  )
}
