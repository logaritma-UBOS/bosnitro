"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function deleteIngredient(id: string) {
  try { await prisma.ingredient.delete({ where: { id } }) } catch(e) {}
  revalidatePath("/katalog")
}

export async function deleteProduct(id: string) {
  try { await prisma.product.update({ where: { id }, data: { isActive: false } }) } catch (e) {}
  revalidatePath("/katalog")
}

export async function importProductsFromSupabase({ url, key, table }: { url: string, key: string, table: string }) {
  try {
    const { auth } = await import("@/auth")
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")
      
    const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
    if (!business) throw new Error("Business not found")

    // Fetch data from Supabase REST API
    const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${table}?select=*`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch from Supabase: ${response.statusText}`)
    }

    const data = await response.json()
    if (!Array.isArray(data)) throw new Error("Format data Supabase tidak valid (harus berupa array)")

    let count = 0
    // Lakukan mapping kolom pintar (asumsi umum: nama/title/name, harga/price)
    for (const item of data) {
      const name = item.name || item.nama || item.title || item.produk || item.nama_produk || "Produk Import"
      const price = parseFloat(item.price || item.harga || item.harga_normal || item.harga_jual || item.sellPrice || 0)
      const image = item.gambar_url || item.image || item.foto || null
      
      await prisma.product.create({
        data: {
          businessId: business.id,
          name: name,
          sellPrice: price,
          imageUrl: image,
          isActive: true,
          showInStore: true,
          // Ritel config
          isSellable: true,
          isPurchasable: true,
          trackInventory: true,
          hasBOM: false,
          calculatedHpp: 0,
          calculatedMargin: 0
        }
      })
      count++
    }

    revalidatePath("/katalog")
    return { count }
  } catch (error: any) {
    return { error: error.message }
  }
}
