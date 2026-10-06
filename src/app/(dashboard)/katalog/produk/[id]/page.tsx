import FormattedNumberInput from '@/components/FormattedNumberInput';
import { formatNumber, formatRupiah } from '@/lib/format';
export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { addRecipeItem, deleteRecipeItemSecure } from "@/actions/catalog"
import { updateProductHpp } from "@/lib/engines/hppEngine"
import { StockUpdateForm, CostUpdateForm } from "./StockForms"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  const id = (await params).id
  
  const product = await prisma.product.findUnique({
    where: { id: id },
    include: { 
      recipes: { include: { ingredient: true } },
      business: true
    }
  })
  
  if (!product || product.business.userId !== session.user.id) redirect("/katalog")

  const ingredients = await prisma.ingredient.findMany({ where: { businessId: product.businessId } })
  const profit = Math.max(0, product.sellPrice - product.calculatedHpp)

  // Aggregate stock for retail
  let currentStock = 0
  if (!product.hasBOM && product.trackInventory) {
    const stockMovements = await prisma.stockMovement.aggregate({
      _sum: { quantity: true },
      where: { productId: product.id }
    })
    currentStock = stockMovements._sum.quantity || 0
  }

  const isFnB = product.business.businessType === 'F_AND_B'
  const bomTitle = isFnB ? "Rincian Resep (Penentu HPP)" : "Material / Komponen Tambahan"
  const addBomLabel = isFnB ? "Tambah Bahan Baku" : "Tambah Komponen"
  const emptyBomMsg = isFnB 
    ? "Tambahkan bahan ke resep di bawah ini agar UBOS bisa menghitung Modal/HPP otomatis." 
    : "Tambahkan komponen material di bawah ini agar HPP otomatis terhitung."

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
      <div className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <Link href="/katalog" className="text-sm font-semibold text-gray-600 hover:text-gray-900">&larr; Kembali</Link>
        <h1 className="font-bold text-gray-900 truncate px-2">{product.name}</h1>
        <Link href={`/katalog/produk/${product.id}/edit`} className="text-emerald-600 text-sm font-bold hover:underline">Edit</Link>
      </div>
      
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">

        {/* Photo Section */}
        {product.imageUrl && (
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex justify-center mb-6">
            <div className="relative w-full aspect-square max-h-[300px] md:max-h-[400px] rounded-xl overflow-hidden">
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
            </div>
          </div>
        )}
        
        {/* Alur Kalkulasi Card */}
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100">
            <h2 className="font-bold text-emerald-900 text-sm">Alur Keuntungan Otomatis</h2>
          </div>
          
          <div className="p-4 space-y-4">
            
            {/* 1. HPP */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  {product.hasBOM ? "1. Total HPP (Modal)" : (!product.hasBOM && !product.trackInventory ? "Biaya Modal Dasar" : "1. Harga Beli / Modal")}
                </p>
                <p className="text-xs text-gray-500">
                  {product.hasBOM ? (isFnB ? "Dari total biaya resep" : "Dari total biaya material") : (!product.hasBOM && !product.trackInventory ? "Layanan Jasa (HPP Rp0)" : "Sesuai HPP input")}
                </p>
              </div>
              <p className="font-bold text-orange-600">{formatRupiah(product.calculatedHpp)}</p>
            </div>
            
            {/* 2. Harga Jual */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-700">2. Harga Jual</p>
                <p className="text-xs text-gray-500">Yang dibayar pelanggan</p>
              </div>
              <p className="font-bold text-emerald-700">{formatRupiah(product.sellPrice)}</p>
            </div>
            
            {/* 3. Margin */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-gray-900">Keuntungan Kotor</p>
                <p className="text-xs text-emerald-600 font-semibold">Margin: {product.calculatedMargin.toFixed(0)}%</p>
              </div>
              <p className="text-xl font-black text-gray-900">{formatRupiah(profit)}</p>
            </div>
            
          </div>
        </div>

        {/* Kondisi Jual Langsung (RETAIL) */}
        {!product.hasBOM && product.trackInventory && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-sm">Informasi Ritel & Persediaan</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="border-b border-gray-100 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-gray-700">Penyesuaian Stok Cepat</p>
                  {currentStock > 0 && (
                    <form action={async () => {
                      "use server"
                      if (currentStock > 0) {
                        await prisma.stockMovement.create({
                          data: {
                            businessId: product.businessId,
                            productId: product.id,
                            type: 'OUT',
                            quantity: -currentStock,
                            referenceType: 'ADJUSTMENT'
                          }
                        })
                        revalidatePath(`/katalog/produk/${product.id}`, "layout")
                        revalidatePath(`/katalog`, "layout")
                      }
                    }}>
                      <button type="submit" className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 font-bold px-3 py-1 rounded-full transition-colors border border-orange-200">
                        🔄 Retur Titipan (Nol-kan)
                      </button>
                    </form>
                  )}
                </div>
                <StockUpdateForm
                  productId={product.id}
                  businessId={product.businessId}
                  currentStock={currentStock}
                  onStockUpdate={async (formData) => {
                    "use server"
                    const newStock = parseFloat(formData.get("newStock") as string) || 0
                    const delta = newStock - currentStock
                    if (delta !== 0) {
                      await prisma.stockMovement.create({
                        data: {
                          businessId: product.businessId,
                          productId: product.id,
                          type: delta > 0 ? 'IN' : 'OUT',
                          quantity: delta,
                          referenceType: 'ADJUSTMENT'
                        }
                      })
                      revalidatePath(`/katalog/produk/${product.id}`, "layout")
                      revalidatePath(`/katalog`, "layout")
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">Update angka di atas untuk menyesuaikan stok, atau gunakan tombol Retur untuk barang konsinyasi di penghujung hari.</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Edit Harga Beli / Modal</p>
                <CostUpdateForm
                  defaultValue={product.purchaseCost}
                  onCostUpdate={async (formData) => {
                    "use server"
                    if (product.hasBOM || !product.trackInventory) return
                    const newCost = parseFloat(formData.get("purchaseCost") as string) || 0
                    const newMargin = product.sellPrice > 0 ? ((product.sellPrice - newCost) / product.sellPrice) * 100 : 0
                    await prisma.product.update({ 
                      where: { id: product.id }, 
                      data: { purchaseCost: newCost, calculatedHpp: newCost, calculatedMargin: newMargin } 
                    })
                    revalidatePath(`/katalog/produk/${product.id}`, "layout")
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Kondisi Jasa Murni (SERVICE) */}
        {!product.hasBOM && !product.trackInventory && (
           <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-center">
             <p className="text-sm text-blue-800 font-semibold mb-1">Item Layanan / Jasa</p>
             <p className="text-xs text-blue-600">Item ini tidak memerlukan resep ataupun pemotongan stok fisik.</p>
           </div>
        )}

        {/* Resep & Bahan (BOM / HYBRID) */}
        {product.hasBOM && (
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm px-1">{bomTitle}</h3>
            
            <div className="space-y-3 mb-6">
              {product.recipes.map(recipe => (
                <div key={recipe.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900">{recipe.ingredient.name}</p>
                      <p className="text-xs text-gray-500">Pakai: {recipe.quantityNeeded} {recipe.ingredient.unit}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="font-bold text-orange-600">{formatRupiah(Math.round(recipe.quantityNeeded * recipe.ingredient.costPerUnit))}</p>
                    </div>
                  </div>
                  
                  {/* Matematika Detail Accordion */}
                  <details className="group border-t border-gray-100 bg-gray-50">
                    <summary className="text-xs font-medium text-gray-500 cursor-pointer list-none flex justify-between items-center p-2 px-3">
                      <span>Lihat detail matematika</span>
                      <span className="group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="px-3 pb-3 pt-1 flex justify-between items-center">
                      <p className="text-xs text-gray-500">
                        Harga: {formatRupiah(recipe.ingredient.costPerUnit)} / {recipe.ingredient.unit}
                        <br/>
                        Kalkulasi: {recipe.quantityNeeded} x {formatRupiah(recipe.ingredient.costPerUnit)}
                      </p>
                      <form action={async () => {
                        "use server"
                        try {
                          await deleteRecipeItemSecure(recipe.id, product.id)
                        } catch (e) {
                          console.log("Already deleted or error", e)
                        }
                      }}>
                        <button type="submit" className="text-red-500 text-xs font-bold p-1 bg-red-50 rounded">Hapus</button>
                      </form>
                    </div>
                  </details>
                </div>
              ))}
              
              {product.recipes.length === 0 && (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg text-center">
                  <p className="text-sm text-orange-800 font-semibold mb-1">HPP belum terhitung!</p>
                  <p className="text-xs text-orange-600">{emptyBomMsg}</p>
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-3 text-sm">{addBomLabel}</h4>
              <form action={async (formData) => {
                "use server"
                await addRecipeItem(formData)
              }} className="space-y-3">
                <input type="hidden" name="productId" value={product.id} />
                <select name="ingredientId" className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 text-sm bg-gray-50">
                  <option value="">-- Pilih {isFnB ? "Bahan Baku" : "Material"} --</option>
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <FormattedNumberInput name="quantityNeeded" step="any" placeholder="Kuantitas?" className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 text-sm bg-gray-50" />
                  <button type="submit" className="bg-emerald-600 text-white font-bold px-5 rounded-lg text-sm whitespace-nowrap shadow-sm">Tambah</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
