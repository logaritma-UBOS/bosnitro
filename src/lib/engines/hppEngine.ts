import { prisma } from "@/lib/prisma"

// Menghitung HPP murni berdasarkan resep dan harga bahan (Pure Function)
export async function calculateHpp(productId: string): Promise<number> {
  const recipes = await prisma.recipe.findMany({
    where: { productId },
    include: { ingredient: true }
  })
  
  let totalHpp = 0
  for (const item of recipes) {
    totalHpp += (item.quantityNeeded * item.ingredient.costPerUnit)
  }
  
  return totalHpp
}

// Memperbarui HPP dan Margin di database, bisa dipanggil saat resep/harga bahan berubah
export async function updateProductHpp(productId: string) {
  const newHpp = await calculateHpp(productId)
  
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new Error("Produk tidak ditemukan")
    
  const newMargin = product.sellPrice > 0 
    ? ((product.sellPrice - newHpp) / product.sellPrice) * 100 
    : 0

  await prisma.product.update({
    where: { id: productId },
    data: { 
      calculatedHpp: newHpp,
      calculatedMargin: newMargin
    }
  })
  
  return { newHpp, newMargin }
}
